class Bid < ApplicationRecord
  belongs_to :auction
  belongs_to :user

  validates :amount, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validate :auction_is_active
  validate :meets_minimum_bid

  private

  def auction_is_active
    return unless auction
    errors.add(:base, "Auction has ended") unless auction.active?
  end

  # Since the minimum bid calculated automatically, this should never happen
  def meets_minimum_bid
    return unless auction && amount
    errors.add(:amount, "must be at least #{auction.minimum_bid}") unless amount >= auction.minimum_bid
  end
end
