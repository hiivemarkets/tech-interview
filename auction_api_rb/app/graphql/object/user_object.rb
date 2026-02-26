module GraphQL
  class UserObject < GraphQL::Object
    field :id, :id, null: false
    field :name, :string, null: false
  end
end