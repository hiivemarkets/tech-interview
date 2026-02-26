require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid with a name" do
    user = User.new(name: "Stella")
    assert user.valid?
  end

  test "invalid without a name" do
    user = User.new(name: nil)
    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test "has many bids" do
    user = User.create!(name: "Stella")
    auctioneer = User.create!(name: "Auctioneer")
    auction = Auction.create!(item_name: "Slinky", auctioneer: auctioneer)
    bid = Bid.create!(auction: auction, user: user, amount: 1)
    assert_includes user.bids, bid
  end

  test "has many auctions as auctioneer" do
    user = User.create!(name: "Stella")
    auction = Auction.create!(item_name: "Slinky", auctioneer: user)
    assert_includes user.auctions_as_auctioneer, auction
  end
end