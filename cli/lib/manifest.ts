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
  erc20TransferableReceivableArtifact,
} from "@requestnetwork/smart-contracts";
import { EventFragment } from "@ethersproject/abi";
import { camelCase } from "lodash";

const paymentNetworks = {
  ERC20Proxy: erc20ProxyArtifact,
  ERC20FeeProxy: erc20FeeProxyArtifact,
  ERC20ConversionProxy: erc20ConversionProxy,
  EthProxy: ethereumProxyArtifact,
  EthFeeProxy: ethereumFeeProxyArtifact,
  EthConversionProxy: ethConversionArtifact,
  ERC20EscrowToPay: erc20EscrowToPayArtifact,
  ERC20TransferrableReceivable: erc20TransferableReceivableArtifact,
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
    receiptNeeded: boolean;
  }[];
  graphEntities: string[];
};

const getArtifactInfo = (artifact: ContractArtifact<any>, network: string) => {
  return artifact
    .getAllAddresses(network)
    .filter(x => Boolean(x.address))
    .map(({ version }) => ({
      ...artifact.getDeploymentInformation(network, version),
      version,
    }))
    .filter(
      (artifact, index, self) =>
        self.findIndex(x => x.address === artifact.address) === index,
    );
};

// Ignore events that are not payment related
const ignoredEvents = [
  "WhitelistAdminAdded",
  "WhitelistAdminRemoved",
  "OwnershipTransferred",
  "Approval",
  "ApprovalForAll",
  "Transfer",
  "TransferableReceivablePayment",
];

export const getManifest = (
  TheGraphChainName: string,
  RequestNetworkChainName: string,
) => {
  const dataSources: DataSource[] = [];

  Object.entries(paymentNetworks).forEach(([pn, artifact]) => {
    let graphEntities: string[];
    if (pn === "ERC20EscrowToPay") {
      graphEntities = ["Payment", "Escrow", "EscrowEvent"];
    } else {
      graphEntities = ["Payment"];
    }

    const infoArray = getArtifactInfo(artifact, RequestNetworkChainName);
    infoArray.forEach(({ version }) => {
      const abiName = version === "0.1.0" ? pn : `${pn}-${version}`;
      fs.writeFileSync(
        `abis/${abiName}.json`,
        JSON.stringify(artifact.getContractAbi(version), null, 2),
      );
    });
    infoArray.forEach(({ address, creationBlockNumber, version }) => {
      const events = artifact
        .getContractAbi(version)
        .filter(x => x.type === "event")
        .filter(x => x.name && !ignoredEvents.includes(x.name))
        .map(x => ({
          handlerName: "handle" + x.name,
          eventSignature: EventFragment.fromObject(x)
            .format("minimal")
            .replace(/^event /, "")
            .replace(/([\w]+) indexed/, "indexed $1"),
          receiptNeeded: x.name !== "TransferWithConversionAndReference",
        }));
      const abiName = version === "0.1.0" ? pn : `${pn}-${version}`;
      dataSources.push({
        abiName,
        name: abiName.replace(/[\-\.]/g, "_"),
        fileName: camelCase(pn),
        network: TheGraphChainName,
        address,
        creationBlockNumber,
        events,
        graphEntities,
      });
    });
  });

  if (dataSources.length === 0) {
    return null;
  }

  const template = fs
    .readFileSync(path.join(process.cwd(), "subgraph.template.yaml"))
    .toString();

  return mustache.render(template, { dataSources });
};
