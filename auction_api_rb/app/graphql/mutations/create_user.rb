# frozen_string_literal: true

module Mutations
  class CreateUser < BaseMutation
    argument :name, String, required: true

    field :user, Types::UserType, null: true
    field :errors, [String], null: true

    def resolve(name:)
      user = User.new(name: name)
      if user.save
        { user: user, errors: [] }
      else
        { user: nil, errors: user.errors.full_messages }
      end
    end
  end
end
