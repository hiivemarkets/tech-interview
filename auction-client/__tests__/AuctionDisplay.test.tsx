import "@testing-library/jest-dom/jest-globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuctionDisplay } from "@/components/AuctionDisplay";
import type { Auction, User } from "@/lib/generated/graphql";

jest.mock("@apollo/client", () => ({
  ...jest.requireActual("@apollo/client"),
  useSubscription: () => ({ data: undefined }),
}));

jest.mock("@/hooks/useCountdown", () => ({
  useCountdown: () => 15,
}));

const user: User = { __typename: "User", id: "1", name: "Alice" };
const auctioneer: User = { __typename: "User", id: "99", name: "Seller" };

function buildAuction(overrides: Partial<Auction> = {}): Auction {
  return {
    __typename: "Auction",
    id: "100",
    itemName: "Vintage Clock",
    currentBid: 50,
    minimumBid: 55,
    endsAt: new Date(Date.now() + 15_000).toISOString(),
    active: true,
    auctioneer,
    winningBid: null,
    ...overrides,
  };
}

describe("active auction", () => {
  it("displays item name, current bid, and minimum bid", () => {
    render(
      <AuctionDisplay
        auction={buildAuction()}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("Vintage Clock")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
    expect(screen.getByText("Bid $55")).toBeInTheDocument();
  });

  it("shows 'You are the high bidder' when user is winning", () => {
    const auction = buildAuction({
      winningBid: { __typename: "Bid", id: "10", amount: 50, user, createdAt: "" },
    });

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("You are the high bidder")).toBeInTheDocument();
  });

  it("does not show winning message for a different user", () => {
    const otherUser: User = { __typename: "User", id: "2", name: "Bob" };
    const auction = buildAuction({
      winningBid: { __typename: "Bid", id: "10", amount: 50, user: otherUser, createdAt: "" },
    });

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.queryByText("You are the high bidder")).not.toBeInTheDocument();
  });

  it("calls onBid when bid button is clicked", async () => {
    const onBid = jest.fn();
    render(
      <AuctionDisplay
        auction={buildAuction()}
        currentUser={user}
        isAuctioneer={false}
        onBid={onBid}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    await userEvent.click(screen.getByText("Bid $55"));
    expect(onBid).toHaveBeenCalledTimes(1);
  });

  it("confirms before bidding when user is already the high bidder", async () => {
    const onBid = jest.fn();
    const auction = buildAuction({
      winningBid: { __typename: "Bid", id: "10", amount: 50, user, createdAt: "" },
    });

    window.confirm = jest.fn(() => true);

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={onBid}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    await userEvent.click(screen.getByText("Bid $55"));
    expect(window.confirm).toHaveBeenCalledWith("You are already the high bidder. Bid again?");
    expect(onBid).toHaveBeenCalledTimes(1);
  });

  it("does not bid when high bidder declines confirmation", async () => {
    const onBid = jest.fn();
    const auction = buildAuction({
      winningBid: { __typename: "Bid", id: "10", amount: 50, user, createdAt: "" },
    });

    window.confirm = jest.fn(() => false);

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={onBid}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    await userEvent.click(screen.getByText("Bid $55"));
    expect(window.confirm).toHaveBeenCalled();
    expect(onBid).not.toHaveBeenCalled();
  });

  it("disables bid button while loading", () => {
    render(
      <AuctionDisplay
        auction={buildAuction()}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={true}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("Bid $55")).toBeDisabled();
  });

  it("displays bid feedback when present", () => {
    render(
      <AuctionDisplay
        auction={buildAuction()}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback="Bid of $55 placed successfully!"
      />
    );

    expect(screen.getByText("Bid of $55 placed successfully!")).toBeInTheDocument();
  });

  it("hides bid button and shows auctioneer label for the auctioneer", () => {
    render(
      <AuctionDisplay
        auction={buildAuction()}
        currentUser={auctioneer}
        isAuctioneer={true}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("You are the auctioneer")).toBeInTheDocument();
    expect(screen.queryByText("Bid $55")).not.toBeInTheDocument();
  });
});

describe("ended auction", () => {
  it("shows winner when auction has a winning bid", () => {
    const auction = buildAuction({
      active: false,
      winningBid: { __typename: "Bid", id: "10", amount: 75, user: { __typename: "User", id: "2", name: "Bob" }, createdAt: "" },
    });

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("Bob won with a bid of $75!")).toBeInTheDocument();
    expect(screen.queryByText("Bid $55")).not.toBeInTheDocument();
  });

  it("shows 'no bids' message when no winning bid", () => {
    const auction = buildAuction({ active: false, winningBid: null });

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("Auction ended with no bids.")).toBeInTheDocument();
  });

  it("shows congratulations when current user won", () => {
    const auction = buildAuction({
      active: false,
      winningBid: { __typename: "Bid", id: "10", amount: 75, user, createdAt: "" },
    });

    render(
      <AuctionDisplay
        auction={auction}
        currentUser={user}
        isAuctioneer={false}
        onBid={jest.fn()}
        bidLoading={false}
        bidFeedback={null}
      />
    );

    expect(screen.getByText("Congratulations, you won!")).toBeInTheDocument();
  });
});
