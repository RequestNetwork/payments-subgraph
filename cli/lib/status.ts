import { request, gql } from "graphql-request";
const query = gql`
  fragment Body on SubgraphIndexingStatus {
    subgraph
    synced
    fatalError {
      message
    }
    nonFatalErrors {
      message
    }
    entityCount
  }
  query Status($subgraph: String!) {
    current: indexingStatusForCurrentVersion(subgraphName: $subgraph) {
      ...Body
    }
    pending: indexingStatusForPendingVersion(subgraphName: $subgraph) {
      ...Body
    }
  }
`;

type BodyResponse = {
  entityCount: number;
  fatalError: { message: string } | null;
  nonFatalErrors: any[];
  subgraph: string;
  synced: true;
};
type QueryResponse = {
  current: BodyResponse;
  pending: BodyResponse | null;
};

export const getStatus = async (network: string) => {
  let response;
  if (network === "mantle-testnet") {
    response = await request<QueryResponse>(
      "https://graph.testnet.mantle.xyz/graphql",
      query,
      { subgraph: `requestnetwork/request-payments-${network}` },
    );
  }
  else if (network === "mantle") {
    response = await request<QueryResponse>(
      "https://graph.fusionx.finance/graphql",
      query,
      { subgraph: `requestnetwork/request-payments-${network}` },
    );
  }
  else {
    response = await request<QueryResponse>(
      "https://api.thegraph.com/index-node/graphql",
      query,
      { subgraph: `requestnetwork/request-payments-${network}` },
    );
  }

  const getValues = (
    body: BodyResponse,
  ): Record<keyof BodyResponse, string | number | boolean | undefined> => ({
    ...body,
    fatalError: body.fatalError?.message,
    nonFatalErrors: body.nonFatalErrors.length,
  });

  const current = getValues(response.current);
  const pending = response.pending ? getValues(response.pending) : null;
  return { current, pending };
};
