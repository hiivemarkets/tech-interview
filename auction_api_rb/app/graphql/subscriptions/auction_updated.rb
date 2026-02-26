# frozen_string_literal: true

module Subscriptions
  class AuctionUpdated < GraphQL::Schema::Subscription
    argument :auction_id, ID, required: true

    field :auction, Types::AuctionType, null: false

    def subscribe(auction_id:)
      auction = Auction.find_by(id: auction_id)
      return { auction: auction } if auction

      raise GraphQL::ExecutionError, "Auction not found"
    end

    def update(auction_id:)
      { auction: object }
    end
  end
end
