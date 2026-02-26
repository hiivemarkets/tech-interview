# Auction System

## Requirements

- [x] A user can hit a button to open bidding and begin the auction. This user is
  the auctioneer. The auctioneer identifies the item with a name.
- [x] Other non-auctioneer users can hit a button to bid on the item. Hitting the
  button should place a new bid for that user at the current winning bid plus
  the current minimum increment.
- [x] The minimum increment is the previous power of ten. Example: if the current
  bid is $90, the next minimum bid is $91. If the current bid is $100, the next
  minimum bid is $110.
- [x] Users should see a confirmation their bid was placed successfully. Bids
  should be placed successfully if (1) the auction has not yet closed and (2)
  the bid exceeds the current minimum increment. Users can see the current
  winning bid, whether that bid is theirs, and when the auction closes.
- [x] When the auction closes, users should be able to see the winning bid amount
  and if they won.

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

### Client-side countdown from server-provided `endsAt`

During the interview I proposed having the server push remaining time to ensure
the backend is the source of truth for auction timing. After implementation I
found this isn't necessary. The server's `endsAt` timestamp is already
authoritative and immutable -- it's set once at auction creation and never
changes. The client receives it via the initial query, then uses its local clock
only to interpolate a visual countdown between that fixed endpoint and now.

Pushing `secondsRemaining` on every subscription update (or worse, every second)
would turn a sparse event-driven subscription into a polling-like system with 30
triggers per auction per subscriber, for no real gain. The only scenario it helps
is significant client clock skew, and even then network latency on each push
makes the correction approximate. The actual auction-closed enforcement lives in
the `Bid` model validation, so a slightly wrong countdown display is cosmetic,
not a correctness issue.

### Subscriptions as the single update path

Mutations return only what the caller needs (errors, bid amount) and don't
duplicate the full auction state. Cache updates for all connected clients come
through the GraphQL subscriptions, which return the complete `Auction` type.
This avoids three redundant update mechanisms (mutation response, manual refetch,
and subscription) all writing the same data.

### Polling for new-auction discovery

Subscriptions require an `auctionId`, so they can't tell a client when a brand
new auction appears. A 5-second poll on `activeAuction` fills that gap. A
broadcast `auctionCreated` subscription would eliminate the delay but adds
complexity for a marginal improvement.

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

## Future Considerations

### Subscription fan-out under high bid volume

The current design triggers a GraphQL subscription resolution for every
subscriber on every bid. At small scale this is fine. At hundreds of concurrent
bidders with rapid-fire bids, two things degrade:

- **Server load:** Each bid causes N subscription resolutions + N WebSocket
  pushes, where N is the number of subscribers. At 10 bids/second with 500
  users, that's 5,000 pushes/second.
- **UI thrashing:** The bid button label (`Bid $91`) and auction stats rewrite
  on every incoming message, making the interface feel unstable and hard to
  click.

The bid itself is still correct regardless -- the server computes the actual
amount at execution time, not the stale value the client displays. So this is a
UX and infrastructure problem, not a correctness one. Possible mitigations, in
order of effort:

1. **Debounce subscription renders on the client** (~500ms batching) so the UI
   updates at a human-readable pace instead of every message.
2. **Optimistic UI on bid placement** -- disable the button and show confirmation
   immediately, don't wait for the subscription round-trip.
3. **Throttle subscription triggers on the server** -- batch so at most one
   `auction_updated` fires per 500ms, cutting fan-out proportionally.
4. **Simplify the bid button** -- show "Place Bid" instead of "Bid $91" since
   the displayed amount is approximate anyway at high volume.

None of these are needed now. The right time to invest is when monitoring shows
actual latency or throughput issues, not speculatively. Shipping the simple
version first and tracking real usage gives concrete data to prioritize against.

### Authentication

User identity is currently passed via an `X-User-Id` header -- not secure, but
sufficient for development. The swap points are intentionally narrow: a single
`current_user` method on the backend, and a single Apollo `setContext` link on
the frontend. Replacing the header with a session cookie or JWT only touches
those two spots.

### New-auction discovery via subscription

The current 5-second poll for detecting new auctions (documented above) could be
replaced with a broadcast subscription that fires whenever any auction is
created. This would eliminate the discovery delay and remove the only polling
query in the app, making the entire frontend fully event-driven.

## Tests

```
cd auction_api_rb
bin/rails test
```
