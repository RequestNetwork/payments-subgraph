import { ethers } from "ethers";
import { request, gql } from "graphql-request";
import { setup } from "axios-cache-adapter";
import { defaultGraphNodeInfo, graphNodeInfoByNetwork } from "../graph-nodes";

const client = setup({
  cache: {
    maxAge: 15 * 60 * 1000,
  },
});

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

const getLastBlockRpc = async (network: string) => {
  const providerUrl = await getProviderUrl(network);
  const provider = providerUrl
    ? new ethers.providers.StaticJsonRpcProvider(providerUrl)
    : ethers.getDefaultProvider(network);

  return await timeout(provider.getBlockNumber(), 3000);
};

const getLastBlockTheGraph = async (network: string) => {
  const data = await request(
    `${graphNodeInfoByNetwork[network]?.queryBase ||
      defaultGraphNodeInfo.queryBase}/subgraphs/name/requestnetwork/request-payments-${network}`,
    query,
  );
  return data._meta.block.number;
};

const getProviderUrl = async (network: string) => {
  if (network === "mantle-testnet") {
    return "https://rpc.testnet.mantle.xyz";
  } else if (network === "mantle") {
    return "https://rpc.mantle.xyz";
  } else {
    const { data } = await client.get<{ name: string; rpcUrls: string[] }[]>(
      "https://api.request.finance/currency/chains",
    );

    return (
      data
        ?.find(x => x.name === network)
        ?.rpcUrls?.[0]?.replace(
          "{ALCHEMY_API_KEY}",
          process.env.ALCHEMY_API_KEY || "",
        )
        .replace("{INFURA_API_KEY}", process.env.INFURA_API_KEY || "") || null
    );
  }
};

export const getDelay = async (network: string) => {
  try {
    const [lastBlock, lastIndexedBlock] = await Promise.all([
      getLastBlockRpc(network),
      getLastBlockTheGraph(network),
    ]);

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
