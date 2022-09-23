import yargs from "yargs";
import networks from "../networks.json";
import { exec } from "child_process";

export const command = "configure-ci [network..]";
export const desc =
  "Configures Github Environments for CI. Configuration is copied from the mainnet environment.";
export const builder = (y: yargs.Argv) =>
  y.positional("network", {
    desc: "The network to deploy to",
    type: "string",
    array: true,
    choices: networks.filter(x => x !== "mainnet"),
    demandOption: true,
  });

const gh = async <T = any>(
  args: string,
  { method, input }: { method?: string; input?: unknown } = {},
) => {
  let params = ["gh", "api", args];
  if (method) {
    params.push("-X");
    params.push(method);
  }
  // hack for input formatted as json: https://github.com/cli/cli/issues/1484
  if (input) {
    params = [
      "jq",
      "-n",
      `'${JSON.stringify(input)}'`,
      "|",
      ...params,
      "--input",
      "-",
    ];
  }

  return await new Promise<T>((resolve, reject) =>
    exec(params.join(" "), (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(stdout));
      }
    }),
  );
};

export const handler = async ({
  network: networkList,
}: Awaited<ReturnType<typeof builder>["argv"]>) => {
  for (const network of networkList) {
    // Get the mainnet configuration
    const mainnet = await gh<{
      protection_rules: {
        reviewers: { type: string; reviewer: { id: number } }[];
      }[];
      deployment_branch_policy: any;
    }>("repos/:owner/:repo/environments/mainnet");

    // format the reviewers field
    const reviewers = mainnet.protection_rules[0]?.reviewers.map(
      ({ type, reviewer }) => ({ type, id: reviewer.id }),
    );

    // create or update the environment based on mainnet values
    await gh(`repos/:owner/:repo/environments/${network}`, {
      method: "PUT",
      input: {
        reviewers,
        deployment_branch_policy: mainnet.deployment_branch_policy,
      },
    });
  }
};
