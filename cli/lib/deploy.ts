import { execSync } from "child_process";
import util from "util";

export const deploySubgraph = (
  subgraphName: string,
  manifestPath: string,
  args: {
    node: string;
    ipfs: string;
    "access-token": string;
  },
) => {
  const argsString = Object.entries(args)
    .map(([name, value]) => `--${name} ${value}`)
    .join(" ");

  return execSync(
    `npx graph deploy ${subgraphName} ${argsString}  ${manifestPath}`,
    {
      stdio: "inherit",
    },
  );
};
