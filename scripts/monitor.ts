import { ethers } from "ethers";
import { request, gql } from "graphql-request";

const query = gql`
  {
    _meta {
      block {
        number
      }
    }
  }
`;

const providers: Record<string, string> = {
  matic: "https://rpc-mainnet.matic.network",
  celo: "https://forno.celo.org",
  fantom: "https://rpc.ftm.tools"
};

const getNetworkStatus = async (network: string) => {
  const data = await request(
    `https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-${network}`,
    query
  );
  const lastSyncedBlock = data._meta.block.number;

  const provider = providers[network]
    ? new ethers.providers.JsonRpcProvider(providers[network])
    : ethers.getDefaultProvider(network);
  const lastBlock = await provider.getBlockNumber();

  return {
    network,
    lastBlock,
    lastSyncedBlock,
    delay: lastBlock - lastSyncedBlock
  };
};

const main = async () => {
  const statuses = await Promise.all(
    ["rinkeby", "matic", "celo", "fantom"].map(getNetworkStatus)
  );
  console.table(statuses);
};

main();
