defmodule AuctionApi.Repo do
  use Ecto.Repo,
    otp_app: :auction_api,
    adapter: Ecto.Adapters.Postgres
end
