require "test_helper"

class BidTest < ActiveSupport::TestCase
  setup do
    @auctioneer = User.create!(name: "Auctioneer")
    @bidder = User.create!(name: "Stella")
    @auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
  end

  test "valid bid on active auction" do
    bid = Bid.new(auction: @auction, user: @bidder, amount: 1)
    assert bid.valid?
  end

  test "invalid without an amount" do
    bid = Bid.new(auction: @auction, user: @bidder, amount: nil)
    assert_not bid.valid?
  end

  test "invalid with non-integer amount" do
    bid = Bid.new(auction: @auction, user: @bidder, amount: 1.5)
    assert_not bid.valid?
  end

  test "invalid with zero amount" do
    bid = Bid.new(auction: @auction, user: @bidder, amount: 0)
    assert_not bid.valid?
  end

  test "invalid with negative amount" do
    bid = Bid.new(auction: @auction, user: @bidder, amount: -5)
    assert_not bid.valid?
  end

  test "valid when amount meets minimum bid" do
    @auction.bids.create!(user: User.create!(name: "Other"), amount: 100)
    bid = Bid.new(auction: @auction, user: @bidder, amount: 110)
    assert bid.valid?
  end
end