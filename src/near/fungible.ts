import {
  near,
  log,
  json,
  BigInt,
  JSONValueKind,
  BigDecimal,
  typeConversion,
} from "@graphprotocol/graph-ts";
import { generateId } from "./shared";
import { Payment } from "../../generated/near/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  log.debug("handleReceipt for block {}, {} actions", [
    receipt.block.header.hash.toHexString(),
    receipt.receipt.actions.length.toString(),
  ]);
  const actions = receipt.receipt.actions;
  for (let i = 0; i < actions.length; i++) {
    handleAction(actions[i], receipt);
  }
}

function handleAction(
  action: near.ActionValue,
  receiptWithOutcome: near.ReceiptWithOutcome,
): void {
  const receipt = receiptWithOutcome.receipt;
  if (action.kind != near.ActionKind.FUNCTION_CALL) {
    return;
  }
  if (!near.SuccessStatus.fromReceiptId(receipt.id)) {
    return;
  }

  const outcome = receiptWithOutcome.outcome;

  const functionCall = action.toFunctionCall();
  if (
    // Only this last callback method is of interest
    functionCall.methodName != "on_transfer_with_reference"
  ) {
    return;
  }
  log.debug("on_transfer_with_reference found, parsing {} logs sent by {}", [
    outcome.logs.length.toString(),
    receiptWithOutcome.receipt.receiverId,
  ]);
  for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
    const outcomeLog = outcome.logs[logIndex];
    const parsedOutcomeTry = json.try_fromString(outcomeLog);

    if (
      parsedOutcomeTry.isOk &&
      parsedOutcomeTry.value.kind === JSONValueKind.OBJECT
    ) {
      const parsedOutcome = parsedOutcomeTry.value.toObject();
      if (
        !parsedOutcome ||
        !parsedOutcome.isSet("to") ||
        !parsedOutcome.isSet("amount") ||
        !parsedOutcome.isSet("token_address") ||
        !parsedOutcome.isSet("payment_reference") ||
        !parsedOutcome.isSet("fee_amount") ||
        !parsedOutcome.isSet("fee_address")
      ) {
        log.debug("ignoring outcome with parsing errors", []);
        continue;
      }
      const to = parsedOutcome.get("to");
      const amount = parsedOutcome.get("amount");
      const currency = parsedOutcome.get("token_address");
      const paymentReference = parsedOutcome.get("payment_reference");
      const feeAmount = parsedOutcome.get("fee_amount");
      const feeAddress = parsedOutcome.get("fee_address");
      if (
        to === null ||
        paymentReference === null ||
        amount === null ||
        currency === null ||
        feeAmount === null ||
        feeAddress === null
      ) {
        log.debug("ignoring outcome with missing mandatory info", []);
        continue;
      }
      log.info("Payment found: {} {} sent to {} with ref {}", [
        amount.toString(),
        currency.toString(),
        to.toString(),
        paymentReference.toString(),
      ]);
      savePayment(
        receiptWithOutcome,
        to.toString(),
        paymentReference.toString(),
        BigDecimal.fromString(amount.toString()),
        currency.toString(),
        BigDecimal.fromString(feeAmount.toString()),
        feeAddress.toString(),
      );
    }
  }
}

function savePayment(
  receiptWithOutcome: near.ReceiptWithOutcome,
  to: string,
  paymentReference: string,
  amount: BigDecimal,
  currency: string,
  feeAmount: BigDecimal,
  feeAddress: string,
): void {
  const receipt = receiptWithOutcome.receipt;
  let payment = new Payment(generateId(receipt.id, paymentReference));
  payment.to = to;
  payment.amount = amount;
  // Same denomination and payment currency
  payment.currency = currency;
  payment.tokenAddress = currency;
  payment.reference = paymentReference;
  payment.contractAddress = receiptWithOutcome.receipt.receiverId;

  payment.from = receipt.signerId;
  // Taking the block height instead of hash for compatibility with EVM graphes
  payment.block = BigInt.fromI64(
    receiptWithOutcome.block.header.height - 1,
  ).toI32();
  const textTimestamp = receiptWithOutcome.block.header.timestampNanosec.toString();
  const trimmedTimestamp = textTimestamp.substr(0, textTimestamp.length - 9); // Nanoseconds to seconds
  payment.timestamp = BigInt.fromString(trimmedTimestamp);
  // receipt ID can be mapped to transaction hash 1-1
  payment.receiptId = typeConversion.bytesToBase58(
    receiptWithOutcome.receipt.id,
  );
  payment.gasUsed = BigInt.fromU64(receiptWithOutcome.outcome.gasBurnt);
  payment.gasPrice = receipt.gasPrice;

  payment.feeAmount = feeAmount;
  payment.feeAddress = feeAddress;
  payment.save();
}
