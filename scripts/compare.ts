import { request, gql } from "graphql-request";
import path from "path";
import { networks } from "./networks";

const Hash = require("ipfs-only-hash");
const Compiler = require("@graphprotocol/graph-cli/src/compiler");

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

const getStatus = async (network: string) => {
  const response = await request<QueryResponse>(
    "https://api.thegraph.com/index-node/graphql",
    query,
    { subgraph: `requestnetwork/request-payments-${network}` }
  );

  const getValues = (
    body: BodyResponse
  ): Record<keyof BodyResponse, string | number | boolean | undefined> => ({
    ...body,
    fatalError: body.fatalError?.message,
    nonFatalErrors: body.nonFatalErrors.length
  });

  const current = getValues(response.current);
  const pending = response.pending ? getValues(response.pending) : null;
  return { current, pending };
};

const fakeIpfsClient = () => {
  return {
    add: async (arg: { content: any }[]) => {
      return Promise.resolve([{ hash: Hash.of(arg[0].content) }]);
    },
    pin: {
      add: () => {}
    }
  };
};

const build = async (subgraphManifest: string): Promise<string> => {
  // in next version of @graphprotocol
  // const {
  //   fromFilePath
  // } = require("@graphprotocol/graph-cli/src/command-helpers/data-sources");
  // const { fromDataSources } = require("@graphprotocol/graph-cli/src/protocols");

  // const dataSourcesAndTemplates = await fromFilePath(subgraphManifest);
  // const protocol = fromDataSources(dataSourcesAndTemplates);

  const compiler = new Compiler({
    ipfs: fakeIpfsClient(),
    subgraphManifest,
    outputDir: "./build",
    outputFormat: "wasm",
    skipMigrations: true,
    blockIpfsMethods: true
    // protocol
  });
  return await compiler.compile();
};

const main = async () => {
  const results: Record<
    string,
    { hash: string; current: boolean; pending?: boolean }
  > = {};
  for (const network of networks) {
    const { current, pending } = await getStatus(network);
    const manifest = path.join(__dirname, "..", `subgraph.${network}.yaml`);
    const hash = await build(manifest);

    results[network] = { hash, current: hash === current.subgraph };
    if (pending) {
      results[network].pending = hash === pending.subgraph;
    }
  }
  console.table(results);

  // console.log(network);
  // console.table(
  //   Object.keys(current).reduce(
  //     (acc, key: string) => ({
  //       ...acc,
  //       [key]: {
  //         current: current[key as keyof BodyResponse],
  //         pending: pending ? pending[key as keyof BodyResponse] : null
  //       }
  //     }),
  //     {} as Record<keyof BodyResponse, { current: any; pending: any }>
  //   ),
  //   []
  // );
};

main();
