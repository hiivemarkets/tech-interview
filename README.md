# Auction System

## Architecture Decisions

### GraphQL subscriptions over raw ActionCable

The original implementation used ActionCable's `stream_for` to manually broadcast
auction updates. I replaced this with GraphQL subscriptions backed by ActionCable
as the transport layer.

The key benefit is a single typed contract between frontend and backend. With raw
ActionCable, you're hand-building payload hashes on the server and hoping the
client parses them correctly -- field name mismatches (`winning_bid` vs
`winningBid`), missing fields, or shape changes only surface at runtime. With
GraphQL subscriptions, the client's subscription query declares exactly what it
needs, the server resolves it through the same type system as queries and
mutations, and the schema enforces the contract on both sides.

This also eliminates a parallel API surface. Real-time updates flow through the
same schema as everything else, so there's one set of types to maintain and one
place to look when debugging data issues.

### graphql-ruby over rails-graphql

The starter project used the `rails-graphql` gem. I switched to `graphql-ruby`
for broader community support, better documentation, and built-in ActionCable
subscription support via `GraphQL::Subscriptions::ActionCableSubscriptions`.

### Generated TypeScript types from the schema

The frontend uses GraphQL Code Generator to produce TypeScript types directly
from the backend schema. This closes the loop on type safety -- the schema is the
single source of truth, and any drift between backend fields and frontend usage
is caught at compile time rather than runtime.

### Bid validation at the model layer

Bid validity (auction still active, amount meets minimum) is enforced in model
validations rather than only in the mutation. This guarantees the rules hold
regardless of how a bid is created -- through GraphQL, console, or future entry
points.

## Running Locally

```
# Backend (port 3001)
cd auction_api_rb
bin/rails server -p 3001

# Frontend (port 3000)
cd auction-client
npm run dev
```

## Updating the GraphQL schema

After changing types, queries, or mutations on the backend:

```
cd auction_api_rb
bin/rails graphql:export
```

This dumps the schema to `auction-client/schema.graphql` and regenerates
`lib/generated/graphql.ts` with typed versions of every operation defined in
`lib/operations.ts`.

## Tests

```
cd auction_api_rb
bin/rails test
```
