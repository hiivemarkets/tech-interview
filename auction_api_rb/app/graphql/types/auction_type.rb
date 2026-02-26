# frozen_string_literal: true

module Types
  class AuctionType < Types::BaseObject
    field :id, ID, null: false
    field :item_name, String, null: false
    field :ends_at, GraphQL::Types::ISO8601DateTime, null: false
    field :current_bid, Integer, null: false
    field :minimum_bid, Integer, null: false
    field :winning_bid, Types::BidType, null: true
    field :active, Boolean, null: false

    def active
      object.active?
    end
  end
end
