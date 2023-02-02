import { ethereum, log } from "@graphprotocol/graph-ts";
import { Payment as PaymentEvent } from "../generated/ERC20TransferrableReceivable/ERC20TransferrableReceivable";
import { ReceivablePayment } from "../generated/schema";
import { generateId } from "./shared";

export function createReceivablePaymentForTransferrableReceivable(
  event: PaymentEvent,
): ReceivablePayment {
  let receivablePayment = new ReceivablePayment(
    generateId(event.transaction, event.params.paymentReference),
  );

  receivablePayment.contractAddress = event.address;
  receivablePayment.reference = event.params.paymentReference;
  receivablePayment.tokenAddress = event.params.assetAddress;
  receivablePayment.paymentProxy = event.params.paymentProxy;
  receivablePayment.from = event.transaction.from;
  receivablePayment.to = event.params.recipient;
  receivablePayment.block = event.block.number.toI32();
  receivablePayment.timestamp = event.block.timestamp.toI32();
  receivablePayment.txHash = event.transaction.hash;
  receivablePayment.gasUsed = (event.receipt as ethereum.TransactionReceipt).gasUsed;
  receivablePayment.gasPrice = event.transaction.gasPrice;
  receivablePayment.amount = event.params.amount.toBigDecimal();
  receivablePayment.feeAmount = event.params.feeAmount.toBigDecimal();
  receivablePayment.feeAddress = event.params.feeAddress;

  return receivablePayment;
}

export function handleReceivablePayment(event: PaymentEvent): void {
  log.info("receivable payment event for tx {}", [
    event.transaction.hash.toHexString(),
  ]);
  let receivablePayment = createReceivablePaymentForTransferrableReceivable(
    event,
  );
  receivablePayment.save();
}
