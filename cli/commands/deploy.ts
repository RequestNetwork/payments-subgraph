import yargs from "yargs";
import { deploySubgraph } from "../lib/deploy";
import networks from "../networks.json";
import { defaultGraphNodeInfo, graphNodeInfoByNetwork } from "../graph-nodes";

export const command = "deploy [network..]";
export const desc = "Deploys one subgraph";
export const builder = (y: yargs.Argv) =>
  y
    .middleware(argv => {
      if (process.env.TOKEN) argv.token = process.env.TOKEN;
      if (process.env.VERSION) argv.version = process.env.VERSION;
    }, true)
    .positional("network", {
      desc: "The network to deploy to",
      type: "string",
      array: true,
      choices: networks,
    })
    .option("all", {
      desc: "Deploy on all networks",
      type: "boolean",
    })
    .option("token", {
      desc: "TheGraph token",
      type: "string",
      demandOption: true,
    })
    .option("version", {
      desc: "The subgraph version label, used by non-hosted service graph nodes",
      type: "string",
      demandOption: true,
    })
    .check(({ all, network }) => {
      if (all && network)
        throw new Error("Cannot specify both -all and positional `network`");
      if (all || network) return true;
        throw new Error("One of --all or positional `network` must be specified");
    });

export const handler = ({
  network,
  token,
  all,
  version,
}: Awaited<ReturnType<typeof builder>["argv"]>) => {
  const networkList = all ? networks : network || [];
  for (const net of networkList) {
    console.log(`Deploy on ${net}`);
    deploySubgraph(
      `requestnetwork/request-payments-${net}`,
      `./subgraph.${net}.yaml`,
      {
        ipfs: graphNodeInfoByNetwork[net].ipfs || defaultGraphNodeInfo.ipfs,
        node: `${graphNodeInfoByNetwork[net].graph || defaultGraphNodeInfo.graph}/deploy/`,
      },
      {
        "access-token": token,
      },
    );
  }
};
