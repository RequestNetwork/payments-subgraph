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
      network,
      network === "gnosis" ? "xdai" : network,
    );
    if (!manifest) {
      console.warn(`No contract found for ${network}`);
    } else {
      writeFile(`subgraph.${network}.yaml`, manifest);
    }
  }
};
