import mustache from "mustache";
import fs from "fs";
import path from "path";
import {
  erc20FeeProxyArtifact,
  ContractArtifact,
  erc20ProxyArtifact,
  erc20ConversionProxy,
  ethereumProxyArtifact,
  ethereumFeeProxyArtifact,
  ethConversionArtifact,
  erc20EscrowToPayArtifact,
} from "@requestnetwork/smart-contracts";
import { EventFragment } from "@ethersproject/abi";
import camelCase from "lodash/camelCase";

const networks = [
  "mainnet",
  "rinkeby",
  "matic",
  "celo",
  "bsc",
  "xdai",
  "fantom",
  "fuse",
  "arbitrum-rinkeby",
  "arbitrum-one",
  "avalanche",
];

const paymentNetworks = {
  ERC20Proxy: erc20ProxyArtifact,
  ERC20FeeProxy: erc20FeeProxyArtifact,
  ERC20ConversionProxy: erc20ConversionProxy,
  EthProxy: ethereumProxyArtifact,
  EthFeeProxy: ethereumFeeProxyArtifact,
  EthConversionProxy: ethConversionArtifact,
  ERC20EscrowToPay: erc20EscrowToPayArtifact,
};

type DataSource = {
  name: string;
  network: string;
  address: string;
  abiName: string;
  fileName: string;
  creationBlockNumber: number;
  events: {
    eventSignature: string;
    handlerName: string;
  }[];
  graphEntities: string[];
};

const getArtifactInfo = (artifact: ContractArtifact<any>, network: string) => {
  return artifact
    .getAllAddresses(network)
    .filter((x) => Boolean(x.address))
    .map(({ version }) => ({
      ...artifact.getDeploymentInformation(network, version),
      version,
    }))
    .filter(
      (artifact, index, self) =>
        self.findIndex((x) => x.address === artifact.address) === index
    );
};

const template = fs
  .readFileSync(path.join(__dirname, "../subgraph.template.yaml"))
  .toString();

// Ignore events that are not payment related
const ignoredEvents = ["WhitelistAdminAdded", "WhitelistAdminRemoved"];

for (const network of networks) {
  const dataSources: DataSource[] = [];
  console.log(`parsing network ${network}`);

  Object.entries(paymentNetworks).forEach(([pn, artifact]) => {
    let graphEntities: string[];
    if (pn === "ERC20EscrowToPay") {
      graphEntities = ["Payment", "Escrow", "EscrowEvent"];
    } else {
      graphEntities = ["Payment"];
    }

    const infoArray = getArtifactInfo(artifact, network);
    infoArray.forEach(({ version }) => {
      const abiName = version === "0.1.0" ? pn : `${pn}-${version}`;
      fs.writeFileSync(
        `abis/${abiName}.json`,
        JSON.stringify(artifact.getContractAbi(version), null, 2)
      );
    });
    infoArray.forEach(({ address, creationBlockNumber, version }) => {
      const events = artifact
        .getContractAbi(version)
        .filter((x) => x.type === "event")
        .filter((x) => x.name && !ignoredEvents.includes(x.name))
        .map((x) => ({
          handlerName: "handle" + x.name,
          eventSignature: EventFragment.fromObject(x)
            .format("minimal")
            .replace(/^event /, "")
            .replace(/([\w]+) indexed/, "indexed $1"),
        }));
      const abiName = version === "0.1.0" ? pn : `${pn}-${version}`;
      dataSources.push({
        abiName,
        name: abiName.replace(/[\-\.]/g, "_"),
        fileName: camelCase(pn),
        network,
        address,
        creationBlockNumber,
        events,
        graphEntities,
      });
    });
  });

  if (dataSources.length === 0) {
    console.warn(`No contract found for ${network}`);
    continue;
  }

  const result = mustache.render(template, { dataSources });
  fs.writeFileSync(`subgraph.${network}.yaml`, result);
}
