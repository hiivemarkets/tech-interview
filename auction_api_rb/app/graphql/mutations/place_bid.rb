# frozen_string_literal: true

module Mutations
  class PlaceBid < BaseMutation
    argument :auction_id, ID, required: true

    field :auction, Types::AuctionType, null: true
    field :bid, Types::BidType, null: true
    field :errors, [String], null: true

    def resolve(auction_id:)
      user = context[:current_user]
      return { auction: nil, bid: nil, errors: ["You must be logged in"] } unless user

      auction = Auction.find_by(id: auction_id)
      return { auction: nil, bid: nil, errors: ["Auction not found"] } unless auction

      bid = auction.bids.new(user: user, amount: auction.minimum_bid)
      if bid.save
        AuctionApiRbSchema.subscriptions&.trigger(:auction_updated, { auction_id: auction.id }, auction.reload)
        { auction: auction, bid: bid, errors: [] }
      else
        { auction: auction, bid: nil, errors: bid.errors.full_messages }
      end
    end
  end
end
