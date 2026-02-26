import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { ApolloProvider } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import * as ActionCable from "@rails/actioncable";
import ActionCableLink from "graphql-ruby-client/subscriptions/ActionCableLink";

const RAILS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const httpLink = new HttpLink({
  uri: `${RAILS_URL}/graphql`,
});

const cable = ActionCable.createConsumer(`${RAILS_URL.replace("http", "ws")}/cable`);

const actionCableLink = new ActionCableLink({ cable });

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  actionCableLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
