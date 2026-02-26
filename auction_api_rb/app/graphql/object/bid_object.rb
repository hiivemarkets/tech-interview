module GraphQL
  class BidObject < GraphQL::Object
    field :id, :id, null: false
    field :amount, :int, null: false
    field :user, "UserObject", null: false
  end
end