import networks from "../networks.json";
import { getManifest } from "../lib/manifest";
import { writeFile } from "fs/promises";

export const command = "prepare";

export const desc = "Generates the manifest files for all networks";

export const builder = () => {};

export const handler = () => {
  for (const network of networks) {
    console.log(`parsing network ${network}`);
    const manifest = getManifest(
      getTheGraphChainName(network),
      getRequestNetworkChainName(network),
    );
    if (!manifest) {
      console.warn(`No contract found for ${network}`);
    } else {
      writeFile(`subgraph.${network}.yaml`, manifest);
    }
  }
};

const getTheGraphChainName = (chainName: string) => {
  switch(chainName) {
    case "mantle-testnet":
      return "testnet";
    case "mantle":
      return "mainnet";
    default:
      return chainName;
  }
}

const getRequestNetworkChainName = (chainName: string) => {
  switch(chainName) {
    case "gnosis":
      return "xdai";
    default:
      return chainName;
  }
}