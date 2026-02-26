# frozen_string_literal: true

module Mutations
  class CreateAuction < BaseMutation
    argument :item_name, String, required: true

    field :auction, Types::AuctionType, null: true
    field :errors, [String], null: true

    def resolve(item_name:)
      user = context[:current_user]
      return { auction: nil, errors: ["You must be logged in"] } unless user

      auction = Auction.new(item_name: item_name, auctioneer: user)
      if auction.save
        AuctionEndedJob.set(wait_until: auction.ends_at).perform_later(auction.id)
        { auction: auction, errors: [] }
      else
        { auction: nil, errors: auction.errors.full_messages }
      end
    end
  end
end
