# Request Payments subgraph

This repo contains the code and configuration for Request Payment subgraphs:

- Mainnet (coming soon)
- [Rinkeby](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-rinkeby)
- [Matic](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-matic)
- [Celo](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-celo)

It indexes Request's proxy smart-contracts for easy querying of payment data.

Smart-contract addresses can be found here:

- [ERC20 Proxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/lib/artifacts/ERC20Proxy/index.ts)
- [ERC20 Fee Proxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/lib/artifacts/ERC20FeeProxy/index.ts)
- [ERC20 Conversion Proxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/lib/artifacts/Erc20ConversionProxy/index.ts)

[Learn more about TheGraph](https://thegraph.com/)

## Contributing

```
# setup variables
cp .env.sample .env # don't forget to edit the WEB3_URL and, if required, the NETWORK variable

# install dependencies
yarn
# generate types
yarn codegen
# generate subgraph manifests
yarn prepare

# Run a local Graph Node
docker-compose up -d
# Run
```

## Manifests

The subgraphs manifests are automatically generated using the [prepare script](./scripts/prepare.ts), which uses `@requestnetwork/smart-contracts` NPM package to get the smart-contracts addresses.

> Note: The `TransferWithReferenceAndFee` event is configured twice. That is because the Conversion proxy makes an internal call to the ERC20 Fee proxy. Both `TransferWithReferenceAndFee` and `TransferWithConversionAndReference` need to be parsed for the Conversion smart-contract.

## Deployment

> Hint: You can get your token from your [Dashboard](https://thegraph.com/explorer/dashboard?account=requestnetwork), under RequestNetwork organization.

### Local

```
yarn create-local
yarn deploy-local ./subgraph.rinkeby.yaml
```

### Networks

```
export TOKEN=xxx
yarn deploy requestnetwork/request-payments-{chainname}  --access-token $TOKEN ./subgraph.{chainname}.yaml
```

#### Example: Rinkeby

```
yarn deploy requestnetwork/request-payments-rinkeby  --access-token $TOKEN ./subgraph.rinkeby.yaml
```

#### Example: Matic

```
yarn deploy requestnetwork/request-payments-matic  --access-token $TOKEN ./subgraph.matic.yaml
```

#### Example: Celo

```
yarn deploy requestnetwork/request-payments-celo  --access-token $TOKEN ./subgraph.celo.yaml
```

## Example query

```graphql
{
  payments {
    txHash
    gasUsed
    gasPrice
    contractAddress
    block
    amount
    amountInCrypto
    feeAmount
    feeAmountInCrypto
    feeAddress
    tokenAddress
    maxRateTimespan
    reference
    id
    to
    from
    currency
  }
}
```

## Troubleshooting

### Sync failed with no logs

```
http POST 'https://api.thegraph.com/index-node/graphql'  query="{ indexingStatusForPendingVersion(subgraphName: \"requestnetwork/request-payments-rinkeby\") { subgraph fatalError { message } nonFatalErrors {message } } }" | jq .data
```

### Build issue `TS6054: File '~lib/allocator/arena.ts' not found.`

You probably have an issue in the package resolution of `assemblyscript`.

See next issue for resolution.

### Install issue `Couldn't find match for ...`

This is related to the fact TheGraph uses a very old version of assemblyscript (see [This PR](https://github.com/graphprotocol/graph-ts/pull/185/files) for migration to the latest version).

In the meantime, `yarn cache clean` should resolve it.
