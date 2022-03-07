import { ethers } from "ethers";
import { request, gql } from "graphql-request";
import { networks, providers } from "./networks";
const query = gql`
  {
    _meta {
      block {
        number
      }
    }
  }
`;

const timeout = <T>(promise: Promise<T>, ms: number) => {
  let t: NodeJS.Timeout;
  return Promise.race([
    promise.then(v => {
      clearTimeout(t);
      return v;
    }),
    new Promise(resolve => (t = setTimeout(resolve, ms))).then(() => {
      throw new Error("Timeout after " + ms + " ms");
    }),
  ]);
};

const getNetworkStatus = async (network: string) => {
  try {
    const data = await request(
      `https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-${network}`,
      query,
    );
    const lastIndexedBlock = data._meta.block.number;

    const provider = providers[network]
      ? new ethers.providers.StaticJsonRpcProvider(providers[network])
      : ethers.getDefaultProvider(network);

    const lastBlock = await timeout(provider.getBlockNumber(), 3000);

    return {
      network,
      lastBlock,
      lastIndexedBlock,
      delay: lastBlock - lastIndexedBlock,
    };
  } catch (e) {
    console.warn(
      `Failed to fetch status for ${network}:`,
      (e as Error).message,
    );
    return { network };
  }
};

const main = async () => {
  const network = process.argv[2];
  if (network) {
    if (!networks.includes(network)) {
      console.error(`unknown network ${network}`);
      return;
    }
    const status = await getNetworkStatus(network);
    console.table([status]);
  } else {
    const statuses = await Promise.all(networks.map(getNetworkStatus));
    console.table(statuses);
  }
  process.exit(0);
};

main();
