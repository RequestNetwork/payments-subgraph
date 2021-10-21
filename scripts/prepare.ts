import mustache from "mustache";
import fs from "fs";
import path from "path";
import {
  erc20FeeProxyArtifact,
  ContractArtifact,
  erc20ProxyArtifact,
  erc20ConversionProxy,
  ethereumProxyArtifact
} from "@requestnetwork/smart-contracts";
import { EventFragment } from "@ethersproject/abi";
import camelCase from "lodash/camelCase";

const networks = ["mainnet", "rinkeby", "matic", "celo", "bsc", "xdai"];

const paymentNetworks = {
  ERC20Proxy: erc20ProxyArtifact,
  ERC20FeeProxy: erc20FeeProxyArtifact,
  ERC20ConversionProxy: erc20ConversionProxy,
  EthProxy: ethereumProxyArtifact
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
};

const getArtifactInfo = (artifact: ContractArtifact<any>, network: string) => {
  return artifact
    .getAllAddresses(network)
    .filter(x => Boolean(x.address))
    .map(({ version }) => ({
      ...artifact.getDeploymentInformation(network, version),
      version
    }))
    .filter(
      (artifact, index, self) =>
        self.findIndex(x => x.address === artifact.address) === index
    );
};

const template = fs
  .readFileSync(path.join(__dirname, "../subgraph.template.yaml"))
  .toString();

for (const [pn, artifact] of Object.entries(paymentNetworks)) {
  fs.writeFileSync(
    `abis/${pn}.json`,
    JSON.stringify(artifact.getContractAbi(), null, 2)
  );
}

for (const network of networks) {
  const dataSources: DataSource[] = [];

  Object.entries(paymentNetworks).forEach(([pn, artifact]) => {
    const infoArray = getArtifactInfo(artifact, network);
    infoArray.forEach(({ address, creationBlockNumber, version }, i) => {
      const events = artifact
        .getContractAbi()
        .filter(x => x.type === "event")
        .map(x => ({
          handlerName: "handle" + x.name,
          eventSignature: EventFragment.fromObject(x)
            .format("minimal")
            .replace(/^event /, "")
            .replace(/([\w]+) indexed/, "indexed $1")
        }));

      dataSources.push({
        abiName: pn,
        name: i === 0 ? pn : `${pn}-${version}`,
        fileName: camelCase(pn),
        network,
        address,
        creationBlockNumber,
        events
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
