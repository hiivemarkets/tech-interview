import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_ACTIVE_AUCTION, PLACE_BID } from "@/lib/operations";
import type { Auction, User } from "@/lib/generated/graphql";
import { ErrorBanner } from "@/components/ErrorBanner";
import { CreateUserForm } from "@/components/CreateUserForm";
import { CreateAuctionForm } from "@/components/CreateAuctionForm";
import { AuctionDisplay } from "@/components/AuctionDisplay";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bidFeedback, setBidFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: auctionData,
    loading: auctionLoading,
    refetch: refetchAuction,
  } = useQuery(GET_ACTIVE_AUCTION, { pollInterval: 5000 });

  const auction: Auction | null = auctionData?.activeAuction ?? null;
  const [placeBid, { loading: placeBidLoading }] = useMutation(PLACE_BID);

  const handlePlaceBid = useCallback(async () => {
    if (!auction || !currentUser) return;
    setErrorMsg(null);
    setBidFeedback(null);

    try {
      const { data } = await placeBid({
        variables: { auctionId: auction.id },
        context: { headers: { "X-User-Id": currentUser.id } },
      });
      if (data.placeBid.errors?.length > 0) {
        setErrorMsg(data.placeBid.errors.join(", "));
      } else {
        setBidFeedback(`Bid of $${data.placeBid.bid.amount} placed successfully!`);
        refetchAuction();
        setTimeout(() => setBidFeedback(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }, [auction, currentUser, placeBid, refetchAuction]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold py-4">Auction</h1>
      </div>

      {errorMsg && (
        <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} />
      )}

      {!currentUser ? (
        <CreateUserForm
          onUserCreated={setCurrentUser}
          onError={setErrorMsg}
        />
      ) : (
        <div className="mx-auto max-w-3xl mb-4">
          <p className="text-sm text-gray-600">
            Signed in as <span className="font-semibold">{currentUser.name}</span>
          </p>
        </div>
      )}

      {currentUser && !auction && !auctionLoading && (
        <CreateAuctionForm
          userId={currentUser.id}
          onCreated={refetchAuction}
          onError={setErrorMsg}
        />
      )}

      {currentUser && auction && (
        <AuctionDisplay
          auction={auction}
          currentUser={currentUser}
          onBid={handlePlaceBid}
          bidLoading={placeBidLoading}
          bidFeedback={bidFeedback}
        />
      )}

      {!currentUser && auction && (
        <div className="mx-auto max-w-3xl mt-8 text-center text-gray-500">
          <p>Create a user above to participate in the auction.</p>
        </div>
      )}
    </div>
  );
}
