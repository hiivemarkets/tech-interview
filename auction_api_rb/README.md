# README

1. A user can hit a button to open bidding and begin the auction. This user is
   the auctioneer. The auctioneer identifies the item with a name.
2. Other non-auctioneer users can hit a button to bid on the item. Hitting the
   button should place a new bid for that user at the current winning bid plus
   the current minimum increment.
3. The minimum increment is the previous power of ten. Example: if the current
   bid is $90, the next minimum bid is $91. If the current bid is $100, the next
   minimum bid is $110.
4. Users should see a confirmation their bid was placed successfully. Bids
   should be placed successfully if (1) the auction has not yet closed and (2)
   the bid exceeds the current minimum increment. Users can see the current
   winning bid, whether that bid is theirs, and when the auction closes.
5. When the auction closes, users should be able to see the winning bid amount
   and if they won.
