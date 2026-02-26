class AuctionChannel < ApplicationCable::Channel
  def subscribed
    auction = Auction.active.first
    stream_for auction
  end

  # broadcast at the end of the auction (30 seconds is up/end at has been reached) that the auction is over and what was the winning bid and the winner
  # bidding isn't allowed after the auction is over
  
  


  def unsubscribed
    # TODO: cleanup if needed
  end
end
