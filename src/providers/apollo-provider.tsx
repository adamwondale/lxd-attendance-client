"use client"

import { HttpLink, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { getSession, signOut } from "next-auth/react";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";

function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:9000/graphql",
  });

  const wsLink = typeof window !== "undefined" ? new GraphQLWsLink(
    createClient({
      url: (process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:9000/graphql").replace(/^http/, "ws"),
      connectionParams: async () => {
        const session = await getSession();
        const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    })
  ) : null;

  const authLink = setContext(async (_, { headers }) => {
    // getSession reads the Auth.js session from the client
    const session = await getSession();
    const token = (session?.user as any)?.accessToken;
    
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    };
  });

  const handleUnauthorized = async () => {
    if (typeof window === "undefined") return;
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    const path = window.location.pathname;
    const callbackUrl =
      role === "STUDENT" || path.startsWith("/dashboard/student")
        ? "/student/login"
        : "/admin/login";
    await signOut({ callbackUrl });
  };

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        if (
          err.extensions?.code === "UNAUTHENTICATED" ||
          err.message.includes("Unauthorized")
        ) {
          void handleUnauthorized();
        }
      }
    }
    if (networkError && "statusCode" in networkError && networkError.statusCode === 401) {
      void handleUnauthorized();
    }
  });

  const splitLink = typeof window !== "undefined" && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        errorLink.concat(authLink).concat(httpLink)
      )
    : errorLink.concat(authLink).concat(httpLink);

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: splitLink,
  });
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
