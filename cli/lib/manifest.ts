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
  singleRequestForwarderFactoryArtifact,
  erc20CommerceEscrowWrapperArtifact,
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
  SingleRequestProxyFactory: singleRequestForwarderFactoryArtifact,
  ERC20CommerceEscrowWrapper: erc20CommerceEscrowWrapperArtifact,
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
    .getAllAddresses(network as any)
    .filter((x: any) => Boolean(x.address))
    .map(({ version }: any) => ({
      ...artifact.getDeploymentInformation(network as any, version),
      version,
    }))
    .filter(
      (artifact: any, index: number, self: any[]) =>
        self.findIndex((x) => x.address === artifact.address) === index,
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
  "EthereumFeeProxyUpdated",
  "ERC20FeeProxyUpdated",
];

// Contract-specific events to ignore
const contractSpecificIgnoredEvents: Record<string, string[]> = {
  ERC20CommerceEscrowWrapper: [
    "CommercePaymentAuthorized", // Redundant with PaymentAuthorized
    "TransferWithReferenceAndFee", // Declared but never emitted by this contract (emitted by ERC20FeeProxy)
  ],
};

export const getManifest = (
  TheGraphChainName: string,
  RequestNetworkChainName: string,
) => {
  const dataSources: DataSource[] = [];

  Object.entries(paymentNetworks).forEach(([pn, artifact]) => {
    let graphEntities: string[];
    if (pn === "ERC20EscrowToPay") {
      graphEntities = ["Payment", "Escrow", "EscrowEvent"];
    } else if (pn === "SingleRequestProxyFactory") {
      graphEntities = ["SingleRequestProxyDeployment"];
    } else if (pn === "ERC20CommerceEscrowWrapper") {
      graphEntities = ["Payment", "CommerceEscrow", "CommerceEscrowEvent"];
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
      const contractIgnoredEvents = contractSpecificIgnoredEvents[pn] || [];
      const allIgnoredEvents = [...ignoredEvents, ...contractIgnoredEvents];
      const events = artifact
        .getContractAbi(version)
        .filter((x) => x.type === "event")
        .filter((x) => x.name && !allIgnoredEvents.includes(x.name))
        .map((x) => ({
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
