import mustache from "mustache";
import fs from "fs";
import path from "path";
import {
  erc20FeeProxyArtifact,
  ContractArtifact,
  erc20ProxyArtifact,
  erc20ConversionProxy
} from "@requestnetwork/smart-contracts";

const networks = ["rinkeby", "matic"];

const safeGetInfo = (artifact: ContractArtifact<any>, network: string) => {
  try {
    return artifact.getDeploymentInformation(network);
  } catch (e) {
    if (!e.message.match(/No deployment for network:/)) {
      console.warn(e.message);
    }
    return null;
  }
};

const template = fs
  .readFileSync(path.join(__dirname, "../subgraph.template.yaml"))
  .toString();
for (const network of networks) {
  const proxy = safeGetInfo(erc20ProxyArtifact, network);
  const feeProxy = safeGetInfo(erc20FeeProxyArtifact, network);
  const conversionProxy = safeGetInfo(erc20ConversionProxy, network);
  if (!proxy && !feeProxy && !conversionProxy) {
    console.warn(`No contract found for ${network}`);
    continue;
  }
  const result = mustache.render(template, {
    network,
    proxy,
    feeProxy,
    conversionProxy
  });
  fs.writeFileSync(`subgraph.${network}.yaml`, result);
}
