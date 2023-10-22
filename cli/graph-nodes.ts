type GraphNodeInfo = {
    graph: string
    ipfs: string
}

type GraphNodeInfoByNetwork = Record<string, GraphNodeInfo>

export const graphNodeInfoByNetwork: GraphNodeInfoByNetwork = {
    // Graph Node maintained by Mantle Foundation: https://docs.mantle.xyz/network/for-devs/resources-and-tooling/graph-endpoints
    "mantle-testnet": {
        graph: "https://graph.testnet.mantle.xyz",
        ipfs: "https://ipfs.testnet.mantle.xyz",
    },
    // Graph Node maintained by FusionX: https://fusionx.finance/
    "mantle": {
        graph: "https://graph.fusionx.finance",
        ipfs: "https://api.thegraph.com/ipfs",
    }
}

// TheGraph Hosted Service
export const defaultGraphNodeInfo: GraphNodeInfo = {
    graph: "https://api.thegraph.com",
    ipfs: "https://api.thegraph.com/ipfs",
}