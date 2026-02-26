# frozen_string_literal: true

class AuctionEndedJob < ApplicationJob
  queue_as :default

  def perform(auction_id)
    auction = Auction.find_by(id: auction_id)
    return unless auction
    return if auction.active?

    AuctionApiRbSchema.subscriptions.trigger(:auction_ended, { auction_id: auction.id }, auction)
  end
end
