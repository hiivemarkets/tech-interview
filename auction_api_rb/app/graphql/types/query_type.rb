# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :active_auction, Types::AuctionType, null: true

    def active_auction
      Auction.current
    end
  end
end
