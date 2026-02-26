# frozen_string_literal: true

class AuctionApiRbSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType
  subscription Types::SubscriptionType

  use GraphQL::Subscriptions::ActionCableSubscriptions

  max_query_string_tokens(5000)
  validate_max_errors(100)
end
