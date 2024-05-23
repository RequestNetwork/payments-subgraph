# Request Payments subgraph

This repo contains the code and configuration for Request Payment subgraphs:

Mainnets:
- [Arbitrum One](https://thegraph.com/explorer/subgraphs/3MtDdHbzvBVNBpzUTYXGuDDLgTd1b8bPYwoH1Hdssgp9?view=Overview&chain=arbitrum-one)
- [Avalanche](https://thegraph.com/explorer/subgraphs/A27V4PeZdKHeyuBkehdBJN8cxNtzVpXvYoqkjHUHRCFp?view=Overview&chain=arbitrum-one)
- [Base](https://thegraph.com/explorer/subgraphs/A5AqE5jBRrHYfgqYihwJw9EBZU5MqL6JyN4vLg7sx5jU?view=Overview&chain=arbitrum-one)
- [BSC](https://thegraph.com/explorer/subgraphs/4PScFUi3CFDbop9XzT6gCDtD4RR8kRzyrzSjrHoXHZBt?view=Overview&chain=arbitrum-one)
- [Celo](https://thegraph.com/explorer/subgraphs/5ts3PHjMcH2skCgKtvLLNE64WLjbhE5ipruvEcgqyZqC?view=Overview&chain=arbitrum-one)
- [Core - Hosted by CoreDAO](https://thegraph.coredao.org/subgraphs/name/requestnetwork/request-payments-core)
- [Ethereum Mainnet](https://thegraph.com/explorer/subgraphs/5mXPGZRC2Caynh4NyVrTK72DAGB9dfcKmLsnxYWHQ9nd?view=Overview&chain=arbitrum-one)
- [Fuse](https://thegraph.com/explorer/subgraphs/EHSpUBa7PAewX7WsaU2jbCKowF5it56yStr6Zgf8aDtx?view=Overview&chain=arbitrum-one)
- [Fantom](https://thegraph.com/explorer/subgraphs/6AwmiYo5eY36W526ZDQeAkNBjXjXKYcMLYyYHeM67xAb?view=Overview&chain=arbitrum-one)
- [Gnosis Chain (xDai)](https://thegraph.com/explorer/subgraphs/2UAW7B94eeeqaL5qUM5FDzTWJcmgA6ta1RcWMo3XuLmU?view=Overview&chain=arbitrum-one)
- [Mantle - Hosted by FusionX](https://graph.fusionx.finance/subgraphs/name/request-payments-mantle)
- [Moonbeam](https://thegraph.com/explorer/subgraphs/4Jo3DwA25zyVLeDhyi7cks52dNrkVCWWhQJzm1hKnCfj?view=Overview&chain=arbitrum-one)
- [Near](https://thegraph.com/explorer/subgraphs/9yEg3h46CZiv4VuSqo1erMMBx5sHxRuW5Ai2V8goSpQL?view=Overview&chain=arbitrum-one)
- [Optimism](https://thegraph.com/explorer/subgraphs/525fra79nG3Z1w8aPZh3nHsH5zCVetrVmceB1hKcTrTX?view=Overview&chain=arbitrum-one)
- [Polygon (Matic)](https://thegraph.com/explorer/subgraphs/DPpU1WMxk2Z4H2TAqgwGbVBGpabjbC1972Mynak5jSuR?view=Overview&chain=arbitrum-one)
- [zkSync Era](https://thegraph.com/explorer/subgraphs/HJNZW9vRSGXrcCVyQMdNKxxuLKeZcV6yMjTCyY6T2oon?view=Overview&chain=arbitrum-one)

Testnets:
- [Mantle Testnet - Hosted by Mantle](https://graph.testnet.mantle.xyz/subgraphs/name/request-payments-mantle-testnet)
- [Near Testnet](https://thegraph.com/explorer/subgraphs/AusVyfndonsMVFrVzckuENLqx8t6kcXuxn6C6VbSGd7M?view=Overview&chain=arbitrum-one)
- [Sepolia](https://thegraph.com/explorer/subgraphs/6e8Dcwt3cvsgNU3JYBtRQQ9Sj4P9VVVnXaPjJ3jUpYpY?view=Overview&chain=arbitrum-one)

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
export NETWORK=sepolia
yarn build
```

## Deployment

### Local

```
export NETWORK=sepolia
yarn create-local
yarn deploy-local
```

### Hosted

All deployments are semi-automated through GitHub action.
The first time a subgraph is deployed, it needs to be created on the Graph Node or on Subgraph Studio.

Graph Node locations:
* `core` uses the [Graph Node hosted by CoreDAO](https://thegraph.coredao.org)
* `mantle` uses the [Graph Node hosted by FusionX](https://graph.fusionx.finance)
* `mantle-testnet` uses the [Graph Node hosted by Mantle](https://docs.mantle.xyz/network/for-devs/resources-and-tooling/graph-endpoints)
* all other chains use Subgraph Studio.

When a PR is merged on `main`:
* test chains are deployed immediately, without approval
* mainnet chains require a manual approval in [GitHub actions](https://github.com/RequestNetwork/payments-subgraph/actions).

> **Important**: Once a subgraph is deployed on Subgraph Studio,
> a manual action is required to publish it to the decentralized network.
> See [the documentation](https://thegraph.com/docs/en/publishing/publishing-a-subgraph/) for more information.

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

Run one of these commands to check for indexing delays.

```
# all
yarn subgraph monitor
# one network
yarn subgraph monitor --network NETWORK_NAME
# several networks
yarn subgraph monitor --network NETWORK_NAME_1 NETWORK_NAME_2
```

Some networks will require you to set env vars:

```
export ALCHEMY_API_KEY=...
export INFURA_API_KEY=...
```

### Hosting service API

URL: https://api.thegraph.com/index-node/graphql
Schema: https://github.com/graphprotocol/graph-node/blob/master/server/index-node/src/schema.graphql

### Sync failed with no logs

```
http POST 'https://api.thegraph.com/index-node/graphql'  query="{ indexingStatusForPendingVersion(subgraphName: \"requestnetwork/request-payments-sepolia\") { subgraph fatalError { message } nonFatalErrors {message } } }" | jq .data
```

### Build issue `TS6054: File '~lib/allocator/arena.ts' not found.`

You probably have an issue in the package resolution of `assemblyscript`.

See next issue for resolution.

### Install issue `Couldn't find match for ...`

This is related to the fact TheGraph uses a very old version of assemblyscript (see [This PR](https://github.com/graphprotocol/graph-ts/pull/185/files) for migration to the latest version).

In the meantime, `yarn cache clean` should resolve it.

### Failed to fetch status for mainnet: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)

Need to set env var ALCHEMY_API_KEY or INFURA_API_KEY.
