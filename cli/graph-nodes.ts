type GraphNodeInfo = {
  queryBase: string;
  deploy: string;
  index: string;
  ipfs: string;
};

type GraphNodeInfoByNetwork = Record<string, GraphNodeInfo>;

export const graphNodeInfoByNetwork: GraphNodeInfoByNetwork = {
  /* Graph Node maintained by Mantle Foundation:
    https://docs.mantle.xyz/network/for-devs/resources-and-tooling/graph-endpoints */
  "mantle-testnet": {
    queryBase: "https://graph.testnet.mantle.xyz",
    deploy: "https://graph.testnet.mantle.xyz/deploy",
    index: "https://graph.testnet.mantle.xyz/graphql",
    ipfs: "https://ipfs.testnet.mantle.xyz",
  },
  // Graph Node maintained by FusionX: https://fusionx.finance/
  mantle: {
    queryBase: "https://graph.fusionx.finance",
    // FusionX Graph Node implements deploy endpoint as a subdomain
    deploy: "https://deploy.graph.fusionx.finance",
    index: "https://graph.fusionx.finance/graphql",
    ipfs: "https://api.thegraph.com/ipfs",
  },
  /* Graph Node maintained by CORE DAO:
    https://docs.coredao.org/developer/develop-on-core/core-subgraph */
  core: {
    queryBase: "https://thegraph.coredao.org",
    // FusionX Graph Node implements deploy endpoint as a subdomain
    deploy: "https://thegraph.coredao.org/deploy/",
    index: "https://thegraph.coredao.org/graphql",
    ipfs: "https://thegraph.coredao.org/ipfs/",
  },
};

// TheGraph Hosted Service
export const defaultGraphNodeInfo: GraphNodeInfo = {
  queryBase: "https://api.thegraph.com",
  deploy: "https://api.thegraph.com/deploy",
  /* TheGraph Hosted Service has a different endpoint for checking subgraph health.
    https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-hosted/#checking-subgraph-health */
  index: "https://api.thegraph.com/index-node/graphql",
  ipfs: "https://api.thegraph.com/ipfs",
};
