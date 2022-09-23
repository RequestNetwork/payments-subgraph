import { existsSync } from "fs";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import yargs, { array } from "yargs";
import networks from "../networks.json";
import { compile } from "../lib/compile";
import { getStatus } from "../lib/status";

export const command = "compare [network..]";
export const desc = "Compares local and deployed version of a subgraph";
export const builder = (y: yargs.Argv) =>
  y
    .positional("network", {
      type: "string",
      array: true,
      desc: "The network to compare. If omitted, all network are compared",
      choices: networks,
      default: networks,
    })
    .option("build", {
      type: "boolean",
      desc:
        "Whether to (re)build the subgraph. If omitted, will try to use cache",
    });

export const handler = async ({
  network: networkList,
  build,
}: Awaited<ReturnType<typeof builder>["argv"]>) => {
  if (build) {
    const hashes: Record<string, string> = {};
    for (const network of networkList) {
      const manifest = path.join(process.cwd(), `subgraph.${network}.yaml`);
      const hash = await compile(manifest);
      hashes[network] = hash;
    }
    await writeFile("cache.json", JSON.stringify(hashes, null, 2));
  }

  if (!existsSync("cache.json")) {
    throw new Error("No cache found. Run with --build the first time");
  }
  const hashes = JSON.parse((await readFile("cache.json")).toString());

  const results: Record<
    string,
    { hash: string; current: boolean; pending?: boolean }
  > = {};

  for (const network of networkList) {
    const { current, pending } = await getStatus(network);
    const hash = hashes[network];
    if (!hash) {
      console.warn(
        `No hash found for ${network}. You might want to run again with --build`,
      );
      continue;
    }

    results[network] = { hash: hash, current: hash === current.subgraph };
    if (pending) {
      results[network].pending = hash === pending.subgraph;
    }
  }
  console.table(results);
};
