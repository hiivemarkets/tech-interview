# frozen_string_literal: true

module Types
  class SubscriptionType < Types::BaseObject
    field :auction_updated, subscription: Subscriptions::AuctionUpdated
    field :auction_ended, subscription: Subscriptions::AuctionEnded
  end
end
