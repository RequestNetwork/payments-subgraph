import { request, gql } from "graphql-request";
import fs from "fs";

const query = gql`
  query Query($take: Int!, $id: String!) {
    payments(first: $take, where: { id_gt: $id }) {
      id
      contractAddress
      txHash
      reference
    }
  }
`;

const PAGE_SIZE = 1000;
const fetchPayments = async (network: string) => {
  fs.appendFileSync(
    `./payments-${network}.csv`,
    ["txHash", "reference", "contractAddress"].join(","),
  );

  let lastId = "";
  while (true) {
    const { payments } = await request<{
      payments: {
        id: string;
        contractAddress: string;
        txHash: string;
        reference: string;
      }[];
    }>(
      `https://api.thegraph.com/subgraphs/name/requestnetwork/request-payments-${network}`,
      query,
      { take: PAGE_SIZE, id: lastId },
    );
    console.log(lastId, payments.length);
    fs.appendFileSync(
      `./payments-${network}.csv`,
      payments
        .map(x => [x.txHash, x.reference, x.contractAddress].join(","))
        .join("\n"),
    );
    if (payments.length < PAGE_SIZE) break;
    lastId = payments[payments.length - 1].id;
  }
};

const compare = (network: string) => {
  const payments = fs
    .readFileSync(`./payments-${network}.csv`)
    .toString()
    .split("\n")
    .slice(1)
    .map(r => r.split(","))
    .map(([txHash, reference]) => ({
      txHash,
      reference,
    }));
  const requests = fs
    .readFileSync(`./requests.csv`)
    .toString()
    .split("\n")
    .map(r => r.split(","))
    .map(([requestId, network, txHash]) => ({
      requestId,
      network,
      txHash,
    }))
    .filter(x => x.network === network);

  for (const payment of payments) {
    if (
      !requests.find(
        req => req.txHash.toLowerCase() === payment.txHash.toLowerCase(),
      )
    ) {
      console.log(payment.reference, "was missed");
    }
  }
};

// void fetchPayments("mainnet");
// void compare("mainnet");
