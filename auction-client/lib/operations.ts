import { gql } from "@apollo/client";

export const GET_ACTIVE_AUCTION = gql`
  query GetActiveAuction {
    activeAuction {
      id
      itemName
      endsAt
      currentBid
      minimumBid
      active
      auctioneer {
        id
        name
      }
      winningBid {
        id
        amount
        user {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($name: String!) {
    createUser(name: $name) {
      user {
        id
        name
      }
      errors
    }
  }
`;

export const CREATE_AUCTION = gql`
  mutation CreateAuction($itemName: String!) {
    createAuction(itemName: $itemName) {
      errors
    }
  }
`;

export const PLACE_BID = gql`
  mutation PlaceBid($auctionId: ID!) {
    placeBid(auctionId: $auctionId) {
      bid {
        amount
      }
      errors
    }
  }
`;

export const AUCTION_UPDATED = gql`
  subscription AuctionUpdated($auctionId: ID!) {
    auctionUpdated(auctionId: $auctionId) {
      auction {
        id
        itemName
        endsAt
        currentBid
        minimumBid
        active
        auctioneer {
          id
          name
        }
        winningBid {
          id
          amount
          user {
            id
            name
          }
        }
      }
    }
  }
`;

export const AUCTION_ENDED = gql`
  subscription AuctionEnded($auctionId: ID!) {
    auctionEnded(auctionId: $auctionId) {
      auction {
        id
        itemName
        endsAt
        currentBid
        minimumBid
        active
        auctioneer {
          id
          name
        }
        winningBid {
          id
          amount
          user {
            id
            name
          }
        }
      }
    }
  }
`;
