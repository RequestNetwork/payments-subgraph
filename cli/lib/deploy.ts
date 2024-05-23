import { execSync } from "child_process";

export const deploySubgraph = (
  subgraphName: string,
  manifestPath: string,
  args: {
    "deploy-key"?: string;
    ipfs?: string;
    node?: string;
    product?: string;
    "version-label"?: string;
  },
) => {
  const argsString = Object.entries(args)
    .map(([name, value]) => (value ? `--${name}=${value}` : ""))
    .join(" ");

  return execSync(
    `yarn run graph deploy ${argsString} ${subgraphName} ${manifestPath}`,
    {
      stdio: "inherit",
    },
  );
};
