type GraphNodeInfo = {
    deploy: string
    query: string
    index: string
    ipfs: string
}

type GraphNodeInfoByNetwork = Record<string, GraphNodeInfo>

export const graphNodeInfo: GraphNodeInfoByNetwork = {
    "mantle-testnet": {
        deploy: "",
        query: "",
        index: "",
        ipfs: "",
    },
    "mantle": {
        deploy: "",
        query: "",
        index: "",
        ipfs: "",
    }
}

export const defaultGraphNodeInfo: GraphNodeInfo = {
    ipfs: "",
    deploy: "",
    query: "",
    index: "",
}