# frozen_string_literal: true

module GraphQL
  class AuctionApiRbSchema < GraphQL::Schema
    field(:hello).resolve { "world" }
  end
end
