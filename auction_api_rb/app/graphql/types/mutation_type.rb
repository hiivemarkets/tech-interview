# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :create_user, mutation: Mutations::CreateUser
    field :create_auction, mutation: Mutations::CreateAuction
    field :place_bid, mutation: Mutations::PlaceBid
  end
end
