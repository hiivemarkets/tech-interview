class User < ApplicationRecord
  has_many :bids
  has_many :auctions_as_auctioneer, class_name: "Auction", foreign_key: :auctioneer_id
  # custom name for user association since it is ambiguous whether `has_many :auctions` refers to auctions they've created or bid on
  # no dependent_destroy on either association since we want to keep the auction record even if the user is deleted
  validates :name, presence: true
end
