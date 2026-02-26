require "test_helper"

class GraphqlChannelTest < ActionCable::Channel::TestCase
  tests GraphqlChannel

  setup do
    @auctioneer = User.create!(name: "Auctioneer")
    @bidder = User.create!(name: "Stella")
  end

  test "subscribes successfully" do
    subscribe(user_id: @bidder.id)
    assert subscription.confirmed?
  end

  test "subscribes without user_id" do
    subscribe
    assert subscription.confirmed?
  end

  test "executes a query" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    subscribe(user_id: @bidder.id)

    perform :execute, {
      "query" => "{ activeAuction { id itemName currentBid active } }"
    }

    result = transmissions.last
    assert_not_nil result
    auction_data = result["result"]["data"]["activeAuction"]
    assert_equal "Slinky", auction_data["itemName"]
    assert_equal 0, auction_data["currentBid"]
    assert_equal true, auction_data["active"]
  end

  test "executes a mutation through the channel" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    subscribe(user_id: @bidder.id)

    perform :execute, {
      "query" => "mutation PlaceBid($auctionId: ID!) { placeBid(auctionId: $auctionId) { bid { amount } errors } }",
      "variables" => { "auctionId" => auction.id.to_s }
    }

    result = transmissions.last
    bid_data = result["result"]["data"]["placeBid"]
    assert_equal 1, bid_data["bid"]["amount"]
    assert_empty bid_data["errors"]
  end
end
