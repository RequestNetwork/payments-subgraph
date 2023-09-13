import yargs from "yargs";
import { deploySubgraph } from "../lib/deploy";
import networks from "../networks.json";

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
    if (net === "mantle-testnet") {
      deploySubgraph(
        `requestnetwork/request-payments-${net}`,
        `./subgraph.${net}.yaml`,
        {
          // Graph Node maintained by Mantle Foundation: https://docs.mantle.xyz/network/for-devs/resources-and-tooling/graph-endpoints
          ipfs: "https://ipfs.testnet.mantle.xyz/",
          node: "https://graph.testnet.mantle.xyz/deploy/",
        },
        {
          "version-label": version,
        },
      )
    } else if (net === "mantle") {
      deploySubgraph(
        `requestnetwork/request-payments-${net}`,
        `./subgraph.${net}.yaml`,
        {
          // Graph Node maintained by FusionX: https://fusionx.finance/
          ipfs: "https://api.thegraph.com/ipfs/",
          node: "https://deploy.graph.fusionx.finance/",
        },
        {
          "version-label": version,
        }
      )
    } else {
      deploySubgraph(
        `requestnetwork/request-payments-${net}`,
        `./subgraph.${net}.yaml`,
        {
          ipfs: "https://api.thegraph.com/ipfs/",
          node: "https://api.thegraph.com/deploy/",
        },
        {
          "access-token": token,
        },
      );
    }
  }
};
