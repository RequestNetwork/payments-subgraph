# Request Payments subgraph

This repo contains the code and configuration for Request Payment subgraphs:

Mainnets:
- [Ethereum Mainnet - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-mainnet)
- [Ethereum Mainnet - Decentralized Network](https://thegraph.com/explorer/subgraphs/5mXPGZRC2Caynh4NyVrTK72DAGB9dfcKmLsnxYWHQ9nd?view=Overview&chain=arbitrum-one)
- [Polygon (Matic) - Hosted Service](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-matic)
- [Polygon (Matic) - Decentralized Network](https://thegraph.com/explorer/subgraphs/DPpU1WMxk2Z4H2TAqgwGbVBGpabjbC1972Mynak5jSuR?view=Overview&chain=arbitrum-one)
- [Celo - Hosted Service](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-celo)
- [Celo - Decentralized Network](https://thegraph.com/explorer/subgraphs/5ts3PHjMcH2skCgKtvLLNE64WLjbhE5ipruvEcgqyZqC?view=Overview&chain=arbitrum-one)
- [BSC - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-bsc)
- [Gnosis Chain (xDai) - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-xdai)
- [Gnosis Chain (xDai) - Decentralized Network](https://thegraph.com/explorer/subgraphs/2UAW7B94eeeqaL5qUM5FDzTWJcmgA6ta1RcWMo3XuLmU?view=Overview&chain=arbitrum-one)
- [Fuse - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-fuse)
- [Fantom - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-fantom)
- [Fantom - Decentralized Network](https://thegraph.com/explorer/subgraphs/6AwmiYo5eY36W526ZDQeAkNBjXjXKYcMLYyYHeM67xAb?view=Overview&chain=arbitrum-one)
- [Near - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-near)
- [Avalanche - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-avalanche)
- [Avalanche - Decentralized Network](https://thegraph.com/explorer/subgraphs/A27V4PeZdKHeyuBkehdBJN8cxNtzVpXvYoqkjHUHRCFp?view=Overview&chain=arbitrum-one)
- [Optimism - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-optimism)
- [Moonbeam - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-moonbeam)
- [Arbitrum One - Hosted Service](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-arbitrum-one)
- [Arbitrum One - Decentralized Network](https://thegraph.com/explorer/subgraphs/3MtDdHbzvBVNBpzUTYXGuDDLgTd1b8bPYwoH1Hdssgp9?view=Overview&chain=arbitrum-one)
- [Mantle - Hosted Service](https://graph.fusionx.finance/subgraphs/name/request-payments-mantle)

Testnets:
- [Goerli](https://thegraph.com/explorer/subgraph/requestnetwork/request-payments-goerli)
- [Near Testnet](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-near-testnet)
- [Arbitrum Rinkeby](https://thegraph.com/hosted-service/subgraph/requestnetwork/request-payments-arbitrum-rinkeby)
- [Mantle Testnet](https://graph.testnet.mantle.xyz/subgraphs/name/request-payments-mantle-testnet)

It indexes Request's proxy smart-contracts for easy querying of payment data.

Smart-contract addresses can be found here:

- [ERC20 Proxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/lib/artifacts/ERC20Proxy/index.ts)
- [ERC20 Fee Proxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/lib/artifacts/ERC20FeeProxy/index.ts)
- [ERC20 Conversion Proxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/lib/artifacts/Erc20ConversionProxy/index.ts)
- [requestnetwork.near](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/payment-detection/src/near-detector.ts)

[Learn more about TheGraph](https://thegraph.com/)

## Contributing

```
# setup variables
cp .env.sample .env # don't forget to edit the WEB3_URL and, if required, the NETWORK variable

# install dependencies
yarn
# generate ABIs & subgraph manifests, and generate types
yarn prepare

# Run a local Graph Node
docker-compose up -d
# Run
```

### Adding a new chain

> This requires the `@requestnetwork/smart-contracts` package to be deployed.

```
export NETWORK=my-network

# update to latest version
yarn add --exact @requestnetwork/smart-contracts@next

# add new network
cat <<< $(jq '. + [env.NETWORK] | unique' cli/networks.json) > cli/networks.json

# update CI (update deployment targets with cli/networks.json)
NETWORKS=$(cat ./cli/networks.json) yq e -i '.jobs.deploy.strategy.matrix.chain |= env(NETWORKS)' .github/workflows/deploy.yaml

# create Github Environment (for CI) based on mainnet
yarn subgraph configure-ci $NETWORK
```

## Manifests

The subgraphs manifests are automatically generated using the [prepare script](./scripts/prepare.ts), which uses `@requestnetwork/smart-contracts` NPM package to get the smart-contracts addresses.

One manifest can refer to many different versions of proxies dealing with the same payment network. The first version found is not explicitely mentionned in generated files and data sources naming. Example; `EthProxy` implicitely refers to the version `0.1.0`. Further versions are referenced in this format: `EthProxy_0_2_0` for the contract `EthProxy` of abi version `0.2.0`.

> Note: The `TransferWithReferenceAndFee` event is configured twice. That is because the Conversion proxy makes an internal call to the ERC20 Fee proxy. Both `TransferWithReferenceAndFee` and `TransferWithConversionAndReference` need to be parsed for the Conversion smart-contract.

### Build

```
export NETWORK=goerli
yarn build
```

## Deployment

### Local

```
export NETWORK=goerli
yarn create-local
yarn deploy-local
```

### Networks

Some of the deployments are automated, others are manual
#### Automated Deployment
Deployment on EVM chains is semi-automated, when a Github release is published

* mantle-testnet uses the [graph node hosted by Mantle](https://docs.mantle.xyz/network/for-devs/resources-and-tooling/graph-endpoints).
* mantle uses the [graph node hosted by FusionX](https://graph.fusionx.finance)
* all other EVM chains use the hosted service.

Test chains like Goerli and Mantle Testnet will be deployed immediately when a release is published.

Mainnets (all others) require manual approval in [github actions](https://github.com/RequestNetwork/payments-subgraph/actions).

#### Manual Deployment

The first time a subgraph is deployed to a non-hosted-service graph node, it needs to be created.

For example:

```bash
yarn graph create --node https://deploy.graph.fusionx.finance requestnetwork/request-payments-mantle
```

For non-EVM deployments like NEAR, use:

```
yarn graph deploy --product hosted-service --deploy-key <GRAPH_KEY> requestnetwork/request-payments-<network> ./subgraph.<network>.yaml
```

For decentralized network, use:
```
yarn graph deploy --studio request-payments-<network> ./subgraph.<network>.yaml --version-label v1.<bumped-version>
```

### Check the deployed version

You can compare the code to the deployed version using one of these commands

```
# all
yarn subgraph compare
# one network
yarn subgraph compare NETWORK_NAME
# several networks
yarn subgraph compare NETWORK_NAME_1 NETWORK_NAME_2
```

## Example query

```graphql
{
  payments {
    txHash
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

### Delays

Some networks will require you to set env vars:

```
export ALCHEMY_API_KEY=...
export INFURA_API_KEY=...
```

Run one of these commands to check for indexing delays.

```
# all
yarn subgraph monitor
# one network
yarn subgraph monitor --network NETWORK_NAME
# several networks
yarn subgraph monitor --network NETWORK_NAME_1 NETWORK_NAME_2
```

### Hosting service API

URL: https://api.thegraph.com/index-node/graphql
Schema: https://github.com/graphprotocol/graph-node/blob/master/server/index-node/src/schema.graphql

### Sync failed with no logs

```
http POST 'https://api.thegraph.com/index-node/graphql'  query="{ indexingStatusForPendingVersion(subgraphName: \"requestnetwork/request-payments-goerli\") { subgraph fatalError { message } nonFatalErrors {message } } }" | jq .data
```

### Build issue `TS6054: File '~lib/allocator/arena.ts' not found.`

You probably have an issue in the package resolution of `assemblyscript`.

See next issue for resolution.

### Install issue `Couldn't find match for ...`

This is related to the fact TheGraph uses a very old version of assemblyscript (see [This PR](https://github.com/graphprotocol/graph-ts/pull/185/files) for migration to the latest version).

In the meantime, `yarn cache clean` should resolve it.

### Failed to fetch status for mainnet: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)

Need to set env var ALCHEMY_API_KEY or INFURA_API_KEY.
