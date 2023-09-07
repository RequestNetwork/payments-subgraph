import { execSync } from "child_process";

export const deploySubgraph = (
  subgraphName: string,
  manifestPath: string,
  args: {
    node: string;
    ipfs: string;
  },
  options?: {
    "access-token"?: string;
    "version-label"?: string;
  }
) => {
  const argsString = Object.entries({...args, ...options})
    .map(([name, value]) => `--${name} ${value}`)
    .join(" ");

  return execSync(
    `npx graph deploy ${subgraphName} ${argsString} ${manifestPath}`,
    {
      stdio: "inherit",
    },
  );
};
