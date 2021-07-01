import { log } from "@graphprotocol/graph-ts";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { Payment } from "../generated/schema";
import { generateId } from "./shared";

export function createPaymentForFeeProxy(
  event: TransferWithReferenceAndFee
): Payment {
  let payment = new Payment(
    generateId(event.transaction, event.params.paymentReference)
  );

  payment.contractAddress = event.address;
  payment.reference = event.params.paymentReference;
  payment.tokenAddress = event.params.tokenAddress;
  payment.to = event.params.to;
  payment.from = event.transaction.from;
  payment.block = event.block.number.toI32();
  payment.timestamp = event.block.timestamp.toI32();
  payment.txHash = event.transaction.hash;
  payment.gasUsed = event.transaction.gasUsed;
  payment.gasPrice = event.transaction.gasPrice;
  payment.amount = event.params.amount.toBigDecimal();
  payment.feeAmount = event.params.feeAmount.toBigDecimal();
  payment.feeAddress = event.params.feeAddress;

  return payment;
}

export function handleTransferWithReferenceAndFee(
  event: TransferWithReferenceAndFee
): void {
  log.info("feeProxy for tx {}", [event.transaction.hash.toHexString()]);
  let payment = createPaymentForFeeProxy(event);

  payment.save();
}
