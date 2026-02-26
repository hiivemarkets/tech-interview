module GraphQL
  class AuctionObject < GraphQL::Object
    field :id, :id, null: false
    field :item_name, :string, null: false
    field :ends_at, :string, null: false
    field :current_bid, :int, null: false
    field :winning_bid, "BidObject"
    # adding minimum_bid would allow us to show users the bid amount before they submit
  end
end