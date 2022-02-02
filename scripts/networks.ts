export const providers: Record<string, string> = {
  mainnet: "",
  rinkeby: "",
  fuse: "",
  matic: "https://rpc-mainnet.matic.network",
  celo: "https://forno.celo.org",
  fantom: "https://rpc.ftm.tools",
  "arbitrum-rinkeby": "https://rinkeby.arbitrum.io/rpc"
  // "arbitrum-one": "https://arb1.arbitrum.io/rpc"
};
export const networks = Object.keys(providers);
