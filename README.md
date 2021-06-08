# Request Payments subgraph

This repo contains the code and configuration for Request Payment subgraphs:
- Mainnet (coming soon)
- [Rinkeby](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-rinkeby)
- [Matic](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-matic)

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

> Hint: You can get your token from your [Dashboard](https://thegraph.com/explorer/dashboard)

### Rinkeby
```
yarn deploy requestnetwork/request-payments-rinkeby  --access-token $TOKEN ./subgraph.rinkeby.yaml
```

### Matic
```
yarn deploy requestnetwork/request-payments-matic  --access-token $TOKEN ./subgraph.matic.yaml
```


## Troubleshooting

### Sync failed with no logs

```
http POST 'https://api.thegraph.com/index-node/graphql'  query="{ indexingStatusForPendingVersion(subgraphName: \"requestnetwork/request-payments-rinkeby\") { subgraph fatalError { message } nonFatalErrors {message } } }" | jq .data
```