require "test_helper"
require "minitest/mock"

class AuctionEndedJobTest < ActiveJob::TestCase
  setup do
    @auctioneer = User.create!(name: "Auctioneer")
  end

  test "triggers auction_ended subscription when auction has expired" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer, ends_at: 1.second.ago)

    mock = Minitest::Mock.new
    mock.expect(:trigger, nil, [:auction_ended, { auction_id: auction.id }, auction])

    AuctionApiRbSchema.stub(:subscriptions, mock) do
      AuctionEndedJob.perform_now(auction.id)
    end

    assert_mock mock
  end

  test "does not trigger subscription if auction is still active" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)

    mock = Minitest::Mock.new
    # No expectations set -- any call to trigger would fail the mock

    AuctionApiRbSchema.stub(:subscriptions, mock) do
      AuctionEndedJob.perform_now(auction.id)
    end

    assert_mock mock
  end

  test "does nothing for nonexistent auction" do
    assert_nothing_raised do
      AuctionEndedJob.perform_now(999999)
    end
  end

  test "is enqueued when auction is created" do
    assert_enqueued_with(job: AuctionEndedJob) do
      Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    end
  end
end
