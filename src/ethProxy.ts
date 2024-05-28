import { ethereum, log } from "@graphprotocol/graph-ts";
import { TransferWithReference } from "../generated/EthProxy_0_3_0/EthProxy_0_3_0";
import { Payment } from "../generated/schema";
import { generateId } from "./shared";

export function handleTransferWithReference(
  event: TransferWithReference,
): void {
  log.info("ethProxy for tx {}", [event.transaction.hash.toHexString()]);
  let payment = new Payment(
    generateId(event.transaction, event.params.paymentReference),
  );
  payment.contractAddress = event.address;
  payment.reference = event.params.paymentReference;
  payment.to = event.params.to;
  payment.from = event.transaction.from;
  payment.block = event.block.number.toI32();
  payment.timestamp = event.block.timestamp.toI32();
  payment.txHash = event.transaction.hash;
  payment.gasUsed = (event.receipt as ethereum.TransactionReceipt).gasUsed;
  payment.gasPrice = event.transaction.gasPrice;
  payment.amount = event.params.amount.toBigDecimal();

  payment.save();
}
