import {
  ERC20SingleRequestProxyCreated,
  EthereumSingleRequestProxyCreated,
} from "../generated/SingleRequestProxyFactory/SingleRequestProxyFactory";
import { SingleRequestProxyDeployment } from "../generated/schema";

export function handleEthereumSingleRequestProxyCreated(
  event: EthereumSingleRequestProxyCreated,
): void {
  let deployment = new SingleRequestProxyDeployment(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString(),
  );
  deployment.proxyAddress = event.params.proxyAddress;
  deployment.payee = event.params.payee;
  deployment.paymentReference = event.params.paymentReference;
  deployment.feeAddress = event.params.feeAddress;
  deployment.feeAmount = event.params.feeAmount;
  deployment.feeProxyUsed = event.params.feeProxyUsed;
  deployment.proxyType = "Ethereum";
  deployment.block = event.block.number.toI32();
  deployment.timestamp = event.block.timestamp.toI32();
  deployment.txHash = event.transaction.hash;
  deployment.save();
}

export function handleERC20SingleRequestProxyCreated(
  event: ERC20SingleRequestProxyCreated,
): void {
  let deployment = new SingleRequestProxyDeployment(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString(),
  );
  deployment.proxyAddress = event.params.proxyAddress;
  deployment.payee = event.params.payee;
  deployment.tokenAddress = event.params.tokenAddress;
  deployment.paymentReference = event.params.paymentReference;
  deployment.feeAddress = event.params.feeAddress;
  deployment.feeAmount = event.params.feeAmount;
  deployment.feeProxyUsed = event.params.feeProxyUsed;
  deployment.proxyType = "ERC20";
  deployment.block = event.block.number.toI32();
  deployment.timestamp = event.block.timestamp.toI32();
  deployment.txHash = event.transaction.hash;
  deployment.save();
}
