require "test_helper"

class AuctionTest < ActiveSupport::TestCase
  setup do
    @auctioneer = User.create!(name: "Auctioneer")
  end

  test "valid with item_name and auctioneer" do
    auction = Auction.new(item_name: "Slinky", auctioneer: @auctioneer)
    assert auction.valid?
  end

  test "invalid without item_name" do
    auction = Auction.new(item_name: nil, auctioneer: @auctioneer)
    assert_not auction.valid?
    assert_includes auction.errors[:item_name], "can't be blank"
  end

  test "sets ends_at automatically on create" do
    freeze_time do
      auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
      assert_equal 30.seconds.from_now, auction.ends_at
    end
  end

  test "does not override ends_at if already set" do
    custom_time = 1.minute.from_now
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer, ends_at: custom_time)
    assert_equal custom_time, auction.ends_at
  end

  test "cannot create auction while another is active" do
    Auction.create!(item_name: "First", auctioneer: @auctioneer)
    second = Auction.new(item_name: "Second", auctioneer: @auctioneer)
    assert_not second.valid?
    assert_includes second.errors[:base], "An active auction already exists"
  end

  test "can create auction after previous one has ended" do
    Auction.create!(item_name: "First", auctioneer: @auctioneer, ends_at: 1.second.ago)
    second = Auction.new(item_name: "Second", auctioneer: @auctioneer)
    assert second.valid?
  end

  test "current_bid returns 0 with no bids" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    assert_equal 0, auction.current_bid
  end

  test "current_bid returns highest bid amount" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 5)
    auction.bids.create!(user: bidder, amount: 15)
    auction.bids.create!(user: bidder, amount: 10)
    assert_equal 15, auction.current_bid
  end

  test "winning_bid returns nil with no bids" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    assert_nil auction.winning_bid
  end

  test "winning_bid returns the highest bid" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder_a = User.create!(name: "Stella")
    bidder_b = User.create!(name: "Sgt. Pepper")
    auction.bids.create!(user: bidder_a, amount: 5)
    winner = auction.bids.create!(user: bidder_b, amount: 10)
    assert_equal winner, auction.winning_bid
  end

  test "minimum_increment is 1 for bids under 10" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 7)
    assert_equal 1, auction.minimum_increment
  end

  test "minimum_increment is 1 at the boundary into tens" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 99)
    assert_equal 1, auction.minimum_increment
  end

  test "minimum_increment is 10 at the boundary into hundreds" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 100)
    assert_equal 10, auction.minimum_increment
  end

  test "minimum_increment is 10 approaching thousands" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 990)
    assert_equal 10, auction.minimum_increment
  end

  test "minimum_increment is 100 at the boundary into thousands" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 1000)
    assert_equal 100, auction.minimum_increment
  end

  test "minimum_bid is 1 when no bids exist" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    assert_equal 1, auction.minimum_bid
  end

  test "minimum_bid is current_bid plus increment" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 90)
    assert_equal 91, auction.minimum_bid
  end

  test "minimum_bid crosses into next power of ten" do
    auction = Auction.create!(item_name: "Slinky", auctioneer: @auctioneer)
    bidder = User.create!(name: "Stella")
    auction.bids.create!(user: bidder, amount: 99)
    assert_equal 100, auction.minimum_bid
  end

  test "active scope returns only auctions that have not ended" do
    expired = Auction.create!(item_name: "Old", auctioneer: @auctioneer, ends_at: 1.minute.ago)
    active = Auction.create!(item_name: "Live", auctioneer: @auctioneer)
    assert_includes Auction.active, active
    assert_not_includes Auction.active, expired
  end

  test "current returns the active auction" do
    Auction.create!(item_name: "Old", auctioneer: @auctioneer, ends_at: 1.minute.ago)
    active = Auction.create!(item_name: "Live", auctioneer: @auctioneer)
    assert_equal active, Auction.current
  end

  test "current returns nil when no auction is active" do
    Auction.create!(item_name: "Old", auctioneer: @auctioneer, ends_at: 1.minute.ago)
    assert_nil Auction.current
  end
end