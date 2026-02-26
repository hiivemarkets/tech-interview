module GraphQL
  class CreateAuctionMutation < GraphQL::Mutation
    argument :item_name, :string, required: true
    # assume user_id is in the context

    field :auction, "AuctionObject", null: false
    field :errors, [String], null: true

    def resolve(item_name:)
      auction = Auction.create!(item_name: item_name, auctioneer: context[:current_user])
      { auction: auction, errors: auction.errors.full_messages || nil }
    end
  end
end