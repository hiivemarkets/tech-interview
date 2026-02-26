module GraphQL
  class GetActiveAuctionQuery < GraphQL::Query
    field :auction, "AuctionObject", null: false

    def resolve
      { auction: Auction.active.first }
    end
  end
end