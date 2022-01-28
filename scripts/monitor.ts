import { ethers } from "ethers";
import { request, gql } from "graphql-request";
import { providers } from "./networks";

const query = gql`
  {
    _meta {
      block {
        number
      }
    }
  }
`;

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
  const statuses = await Promise.all(networks.map(getNetworkStatus));
  console.table(statuses);
};

main();
