import yargs from "yargs";
import { deploySubgraph } from "../lib/deploy";
import networks from "../networks.json";
import { graphNodeInfoByNetwork } from "../graph-nodes";

export const command = "deploy [network..]";
export const desc = "Deploys one subgraph";
export const builder = (y: yargs.Argv) =>
  y
    .middleware(argv => {
      if (process.env.DEPLOY_KEY) argv["deploy-key"] = process.env.DEPLOY_KEY;
      if (process.env.VERSION_LABEL)
        argv["version-label"] = process.env.VERSION_LABEL;
    }, true)
    .positional("network", {
      desc: "The network to deploy to",
      type: "string",
      array: true,
      choices: networks,
    })
    .option("deploy-key", {
      desc: "Graph Node deploy key",
      type: "string",
    })
    .option("version-label", {
      desc: "The version of the deployed subgraph",
      type: "string",
    });

export const handler = ({
  network,
  ["deploy-key"]: deployKey,
  ["version-label"]: versionLabel,
}: Awaited<ReturnType<typeof builder>["argv"]>) => {
  const networkList = network || [];
  for (const net of networkList) {
    console.log(`Deploy on ${net}`);
    deploySubgraph(`request-payments-${net}`, `./subgraph.${net}.yaml`, {
      "deploy-key": deployKey,
      ipfs: graphNodeInfoByNetwork[net]?.ipfs,
      node: graphNodeInfoByNetwork[net]?.deploy,
      product: deployKey ? "subgraph-studio" : undefined,
      "version-label": versionLabel,
    });
  }
};
