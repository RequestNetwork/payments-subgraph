import yargs from "yargs";
import networks from "../networks.json";
import { getDelay } from "../lib/delay";

export const command = "monitor";
export const desc = "Monitors the delays on subgraphs";
export const builder = (y: yargs.Argv) =>
  y.option("network", {
    type: "string",
    array: true,
    desc: "The network to compare. If omitted, all networks are compared",
    choices: networks,
    default: networks,
  });

export const handler = async ({
  network,
}: Awaited<ReturnType<typeof builder>["argv"]>) => {
  const statuses = await Promise.all(network.map(getDelay));
  console.table(statuses);
};
