class Auction < ApplicationRecord
  belongs_to :auctioneer, class_name: "User"
  has_many :bids, dependent: :destroy

  before_validation :set_ends_at, on: :create

  validates :item_name, presence: true
  validates :ends_at, presence: true
  validate :no_active_auction_exists, on: :create

  scope :active, -> { where("ends_at > ?", Time.current) }

  after_create_commit -> { AuctionEndedJob.set(wait_until: ends_at).perform_later(id) }

  def self.current
    active.first || nil
  end

  def active?
    ends_at > Time.current
  end

  def no_active_auction_exists
    if Auction.active.exists?
      errors.add(:base, "An active auction already exists")
    end
  end

  def set_ends_at
    duration = (ENV["AUCTION_DURATION_SECONDS"] || 30).to_i
    self.ends_at ||= duration.seconds.from_now
  end

  def current_bid
    bids.maximum(:amount) || 0
  end

  def minimum_increment
    return 1 if current_bid < 10
    10 ** (Math.log10(current_bid).floor - 1)
  end

  def minimum_bid
    minimum_increment + current_bid
  end

  def winning_bid 
    bids.order(amount: :desc).first || nil
  end 
end