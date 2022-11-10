import { ethereum, log } from "@graphprotocol/graph-ts";
import { Payment as PaymentEvent } from "../generated/InvoiceNFT/InvoiceNFT";
import { Payment } from "../generated/schema";
import { generateId } from "./shared";

export function handlePayment(event: PaymentEvent): void {
  log.info("erc20Nft for tx {}", [event.transaction.hash.toHexString()]);
  let payment = new Payment(
    generateId(event.transaction, event.params.paymentReference),
  );
  payment.contractAddress = event.address;
  payment.reference = event.params.paymentReference;
  payment.tokenAddress = event.params.assetAddress;
  payment.to = event.params.recipient;
  payment.from = event.transaction.from;
  payment.block = event.block.number.toI32();
  payment.timestamp = event.block.timestamp.toI32();
  payment.txHash = event.transaction.hash;
  payment.gasUsed = (event.receipt as ethereum.TransactionReceipt).gasUsed;
  payment.gasPrice = event.transaction.gasPrice;
  payment.amount = event.params.amount.toBigDecimal();

  payment.save();
}
