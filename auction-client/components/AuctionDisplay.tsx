import { useSubscription } from "@apollo/client";
import { AUCTION_UPDATED, AUCTION_ENDED } from "@/lib/operations";
import { useCountdown } from "@/hooks/useCountdown";
import { StatusBadge } from "./StatusBadge";
import type { Auction, User } from "@/lib/generated/graphql";

export function AuctionDisplay({
  auction,
  currentUser,
  isAuctioneer,
  onBid,
  bidLoading,
  bidFeedback,
}: {
  auction: Auction;
  currentUser: User;
  isAuctioneer: boolean;
  onBid: () => void;
  bidLoading: boolean;
  bidFeedback: string | null;
}) {
  const secondsLeft = useCountdown(auction.endsAt);
  const isWinning = auction.winningBid?.user.id === currentUser.id;

  useSubscription(AUCTION_UPDATED, {
    variables: { auctionId: auction.id },
  });

  useSubscription(AUCTION_ENDED, {
    variables: { auctionId: auction.id },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <dl className="mx-auto grid grid-cols-1 gap-px sm:grid-cols-3 lg:grid-cols-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8">
          <dt className="text-sm font-medium leading-6 text-gray-500">Item Name</dt>
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            {auction.itemName}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8">
          <dt className="text-sm font-medium leading-6 text-gray-500">Current Bid</dt>
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            ${auction.currentBid}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 bg-white px-4 py-10 sm:px-6 xl:px-8">
          <dt className="text-sm font-medium leading-6 text-gray-500">High Bidder</dt>
          <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
            {auction.winningBid?.user.name ?? "No bids yet"}
          </dd>
        </div>
      </dl>

      {auction.active ? (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <StatusBadge active={auction.active} secondsLeft={secondsLeft} />
            {isAuctioneer && (
              <span className="text-sm font-medium text-amber-600">
                You are the auctioneer
              </span>
            )}
            {!isAuctioneer && isWinning && (
              <span className="text-sm font-medium text-green-600">
                You are the high bidder
              </span>
            )}
          </div>
          {!isAuctioneer && (
            <div className="flex items-center gap-x-3">
              <span className="text-sm text-gray-500">
                Next bid: ${auction.minimumBid}
              </span>
              <button
                type="button"
                onClick={onBid}
                disabled={bidLoading}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                Bid ${auction.minimumBid}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-gray-50 p-4 text-center">
          <StatusBadge active={false} secondsLeft={null} />
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {auction.winningBid
              ? `${auction.winningBid.user.name} won with a bid of $${auction.winningBid.amount}!`
              : "Auction ended with no bids."}
          </p>
          {auction.winningBid && isWinning && (
            <p className="mt-1 text-sm font-medium text-green-600">
              Congratulations, you won!
            </p>
          )}
        </div>
      )}

      {bidFeedback && (
        <div className="mt-3 rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">{bidFeedback}</p>
        </div>
      )}
    </div>
  );
}
