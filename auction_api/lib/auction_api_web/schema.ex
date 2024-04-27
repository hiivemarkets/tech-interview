defmodule AuctionApiWeb.Schema do
  use Absinthe.Schema

  query do
    @desc "Say hello"
    field :hello, :string do
      resolve(fn _, _ -> {:ok, "Hello"} end)
    end
  end
end
