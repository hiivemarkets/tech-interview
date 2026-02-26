require "test_helper"

class SubscriptionDeliveryTest < ActiveSupport::TestCase
  SUBSCRIBE_AUCTION_UPDATED = <<~GQL
    subscription AuctionUpdated($auctionId: ID!) {
      auctionUpdated(auctionId: $auctionId) {
        auction {
          id
          currentBid
          minimumBid
          active
          winningBid { amount user { name } }
        }
      }
    }
  GQL

  SUBSCRIBE_AUCTION_ENDED = <<~GQL
    subscription AuctionEnded($auctionId: ID!) {
      auctionEnded(auctionId: $auctionId) {
        auction {
          id
          currentBid
          active
          winningBid { amount user { name } }
        }
      }
    }
  GQL

  setup do
    @auctioneer = User.create!(name: "Auctioneer")
    @alice = User.create!(name: "Alice")
    @bob = User.create!(name: "Bob")
    @auction = Auction.create!(item_name: "Black Lotus", auctioneer: @auctioneer)
  end

  test "multiple subscribers receive auction_updated when a bid is placed" do
    alice_channel = subscribe_to_auction_updated(@alice)
    bob_channel = subscribe_to_auction_updated(@bob)

    place_bid(@alice)

    alice_msg = last_subscription_data(alice_channel)
    bob_msg = last_subscription_data(bob_channel)

    [alice_msg, bob_msg].each do |data|
      assert_equal 1, data["currentBid"]
      assert_equal 2, data["minimumBid"]
      assert_equal "Alice", data["winningBid"]["user"]["name"]
    end
  end

  test "subscribers see each bid in sequence from alternating bidders" do
    alice_channel = subscribe_to_auction_updated(@alice)
    bob_channel = subscribe_to_auction_updated(@bob)

    place_bid(@alice)
    place_bid(@bob)
    place_bid(@alice)

    alice_messages = all_subscription_data(alice_channel)
    bob_messages = all_subscription_data(bob_channel)

    assert_equal 3, alice_messages.length
    assert_equal 3, bob_messages.length

    # Both subscribers see the same sequence
    [alice_messages, bob_messages].each do |messages|
      assert_equal [1, 2, 3], messages.map { |m| m["currentBid"] }
      assert_equal [2, 3, 4], messages.map { |m| m["minimumBid"] }
      assert_equal %w[Alice Bob Alice], messages.map { |m| m["winningBid"]["user"]["name"] }
    end
  end

  test "subscriber who joins mid-auction receives only subsequent updates" do
    place_bid(@alice)

    late_channel = subscribe_to_auction_updated(@bob)

    place_bid(@bob)

    messages = all_subscription_data(late_channel)
    assert_equal 1, messages.length
    assert_equal 2, messages.first["currentBid"]
    assert_equal "Bob", messages.first["winningBid"]["user"]["name"]
  end

  test "auction_ended subscription delivers final state" do
    alice_channel = subscribe_to_auction_ended(@alice)
    bob_channel = subscribe_to_auction_ended(@bob)

    place_bid(@alice)
    place_bid(@bob)

    @auction.update_column(:ends_at, 1.second.ago)
    AuctionEndedJob.perform_now(@auction.id)

    alice_data = last_subscription_data(alice_channel)
    bob_data = last_subscription_data(bob_channel)

    [alice_data, bob_data].each do |data|
      assert_equal 2, data["currentBid"]
      assert_equal false, data["active"]
      assert_equal "Bob", data["winningBid"]["user"]["name"]
    end
  end

  private

  def subscribe_to_auction_updated(user)
    channel = GraphQL::Testing::MockActionCable.get_mock_channel
    AuctionApiRbSchema.execute(
      SUBSCRIBE_AUCTION_UPDATED,
      variables: { "auctionId" => @auction.id.to_s },
      context: { channel: channel, current_user: user }
    )
    channel
  end

  def subscribe_to_auction_ended(user)
    channel = GraphQL::Testing::MockActionCable.get_mock_channel
    AuctionApiRbSchema.execute(
      SUBSCRIBE_AUCTION_ENDED,
      variables: { "auctionId" => @auction.id.to_s },
      context: { channel: channel, current_user: user }
    )
    channel
  end

  def place_bid(user)
    result = AuctionApiRbSchema.execute(
      "mutation PlaceBid($auctionId: ID!) { placeBid(auctionId: $auctionId) { errors } }",
      variables: { "auctionId" => @auction.id.to_s },
      context: { current_user: user }
    )
    errors = result["data"]["placeBid"]["errors"]
    assert_empty errors, "Bid failed: #{errors}"
  end

  def last_subscription_data(channel)
    msg = channel.mock_broadcasted_messages.last
    assert_not_nil msg, "Expected a broadcast but none received"
    extract_auction_data(msg)
  end

  def all_subscription_data(channel)
    channel.mock_broadcasted_messages.map { |msg| extract_auction_data(msg) }
  end

  def extract_auction_data(msg)
    result = msg[:result] || msg["result"]
    data = result["data"]
    (data["auctionUpdated"] || data["auctionEnded"])["auction"]
  end
end
