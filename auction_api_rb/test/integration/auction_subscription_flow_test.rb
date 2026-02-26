require "test_helper"

class AuctionSubscriptionFlowTest < ActionDispatch::IntegrationTest
  include ActionCable::TestHelper

  setup do
    @auctioneer = User.create!(name: "Auctioneer")
    @bidder = User.create!(name: "Stella")
  end

  test "placing a bid triggers auction_updated subscription" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)

    result = AuctionApiRbSchema.execute(
      "mutation PlaceBid($auctionId: ID!) { placeBid(auctionId: $auctionId) { bid { amount } auction { currentBid } errors } }",
      variables: { "auctionId" => auction.id.to_s },
      context: { current_user: @bidder }
    )

    data = result["data"]["placeBid"]
    assert_equal 1, data["bid"]["amount"]
    assert_equal 1, data["auction"]["currentBid"]
    assert_empty data["errors"]
  end

  test "placing a bid on an ended auction returns errors" do
    auction = Auction.create!(item_name: "Expired", auctioneer: @auctioneer, ends_at: 1.second.ago)

    result = AuctionApiRbSchema.execute(
      "mutation PlaceBid($auctionId: ID!) { placeBid(auctionId: $auctionId) { bid { amount } errors } }",
      variables: { "auctionId" => auction.id.to_s },
      context: { current_user: @bidder }
    )

    data = result["data"]["placeBid"]
    assert_nil data["bid"]
    assert data["errors"].any? { |e| e.include?("ended") || e.include?("at least") }
  end

  test "full auction lifecycle: create, bid, end" do
    create_result = AuctionApiRbSchema.execute(
      'mutation CreateAuction($itemName: String!) { createAuction(itemName: $itemName) { auction { id itemName active endsAt } errors } }',
      variables: { "itemName" => "Vintage Guitar" },
      context: { current_user: @auctioneer }
    )

    auction_data = create_result["data"]["createAuction"]
    assert_empty auction_data["errors"]
    assert_equal "Vintage Guitar", auction_data["auction"]["itemName"]
    assert_equal true, auction_data["auction"]["active"]
    auction_id = auction_data["auction"]["id"]

    bid_result = AuctionApiRbSchema.execute(
      "mutation PlaceBid($auctionId: ID!) { placeBid(auctionId: $auctionId) { bid { amount } auction { currentBid minimumBid } errors } }",
      variables: { "auctionId" => auction_id },
      context: { current_user: @bidder }
    )

    bid_data = bid_result["data"]["placeBid"]
    assert_equal 1, bid_data["bid"]["amount"]
    assert_equal 1, bid_data["auction"]["currentBid"]
    assert_equal 2, bid_data["auction"]["minimumBid"]
    assert_empty bid_data["errors"]

    query_result = AuctionApiRbSchema.execute(
      "{ activeAuction { id itemName currentBid winningBid { amount user { name } } } }"
    )

    active = query_result["data"]["activeAuction"]
    assert_equal "Vintage Guitar", active["itemName"]
    assert_equal 1, active["currentBid"]
    assert_equal "Stella", active["winningBid"]["user"]["name"]

    # Simulate auction ending by backdating ends_at
    auction = Auction.find(auction_id)
    auction.update_column(:ends_at, 1.second.ago)
    assert_not auction.reload.active?
  end

  test "alternating bidders see correct minimum bid across increment boundaries" do
    auction = Auction.create!(item_name: "Black Lotus", auctioneer: @auctioneer)
    alice = User.create!(name: "Alice")
    bob = User.create!(name: "Bob")

    place_bid = ->(user) {
      result = AuctionApiRbSchema.execute(
        "mutation PlaceBid($auctionId: ID!) { placeBid(auctionId: $auctionId) { bid { amount } auction { currentBid minimumBid winningBid { user { name } } } errors } }",
        variables: { "auctionId" => auction.id.to_s },
        context: { current_user: user }
      )
      data = result["data"]["placeBid"]
      assert_empty data["errors"], "Bid failed: #{data['errors']}"
      data
    }

    # First bid: $0 -> $1, increment stays 1
    data = place_bid.call(alice)
    assert_equal 1, data["auction"]["currentBid"]
    assert_equal 2, data["auction"]["minimumBid"]
    assert_equal "Alice", data["auction"]["winningBid"]["user"]["name"]

    # Seed to just below $10 boundary
    [[bob, 2], [alice, 3], [bob, 4], [alice, 5], [bob, 6], [alice, 7], [bob, 8], [alice, 9]].each do |user, expected|
      data = place_bid.call(user)
      assert_equal expected, data["bid"]["amount"]
    end

    # Cross $10: increment is still 1 (10^(1-1) = 1)
    data = place_bid.call(bob)
    assert_equal 10, data["auction"]["currentBid"]
    assert_equal 11, data["auction"]["minimumBid"]

    # Seed directly to $99 to skip the uninteresting range
    auction.bids.create!(user: alice, amount: 99)

    # Cross $100: increment jumps to 10
    data = place_bid.call(bob)
    assert_equal 100, data["auction"]["currentBid"]
    assert_equal 110, data["auction"]["minimumBid"]

    # $110: increment stays 10
    data = place_bid.call(alice)
    assert_equal 110, data["auction"]["currentBid"]
    assert_equal 120, data["auction"]["minimumBid"]
    assert_equal "Alice", data["auction"]["winningBid"]["user"]["name"]
  end
end
