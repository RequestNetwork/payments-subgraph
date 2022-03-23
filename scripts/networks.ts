export const providers: Record<string, string> = {
  mainnet: "",
  rinkeby: "",
  xdai: "https://rpc.gnosischain.com/",
  fuse: "https://rpc.fuse.io/",
  matic: "https://rpc-mainnet.maticvigil.com",
  celo: "https://forno.celo.org",
  fantom: "https://rpc.ftm.tools",
  bsc: "https://bsc-dataseed.binance.org/",
  "arbitrum-rinkeby": "https://rinkeby.arbitrum.io/rpc",
  "arbitrum-one": "https://arb1.arbitrum.io/rpc",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
};
export const networks = Object.keys(providers);
