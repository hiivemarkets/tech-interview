namespace :graphql do
  desc "Dump the GraphQL schema to the frontend and regenerate TypeScript types"
  task export: :environment do
    schema_path = Rails.root.join("..", "auction-client", "schema.graphql")
    File.write(schema_path, AuctionApiRbSchema.to_definition)
    puts "Schema written to #{schema_path}"

    system("npm run codegen", chdir: Rails.root.join("..", "auction-client").to_s)
  end
end
