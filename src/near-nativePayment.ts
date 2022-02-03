import {
  near,
  log,
  json,
  BigInt,
  Bytes,
  crypto,
  ByteArray,
  JSONValueKind,
  BigDecimal,
  typeConversion,
} from "@graphprotocol/graph-ts";
import { Payment } from "../generated/near/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const actions = receipt.receipt.actions;
  for (let i = 0; i < actions.length; i++) {
    handleAction(actions[i], receipt);
  }
}

function generateId(transactionHash: Bytes, paymentReference: string): string {
  var id = transactionHash.toHex() + paymentReference;
  return crypto.keccak256(ByteArray.fromHexString(id)).toHex();
}

function handleAction(
  action: near.ActionValue,
  receiptWithOutcome: near.ReceiptWithOutcome
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
  if (functionCall.methodName == "transfer_with_reference") {
    for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
      const outcomeLog = outcome.logs[logIndex];
      const parsedOutcomeTry = json.try_fromString(outcomeLog);

      if (
        parsedOutcomeTry.isOk &&
        parsedOutcomeTry.value.kind === JSONValueKind.OBJECT
      ) {
        const parsedOutcome = parsedOutcomeTry.value.toObject();
        if (
          parsedOutcome &&
          parsedOutcome.isSet("receiver") &&
          parsedOutcome.isSet("reference") &&
          parsedOutcome.isSet("amount")
        ) {
          const receiver = parsedOutcome.get("receiver");
          const reference = parsedOutcome.get("reference");
          const amount = parsedOutcome.get("amount");
          if (receiver !== null && reference !== null && amount !== null) {
            log.info("Payment found: {} sent to {} with ref {}}", [
              amount.toString(),
              receiver.toString(),
              reference.toString(),
            ]);
            savePayment(
              receiptWithOutcome,
              BigDecimal.fromString(amount.toString()),
              reference.toString(),
              receiver.toString()
            );
          }
        }
      }
    }
  }
}

function savePayment(
  receiptWithOutcome: near.ReceiptWithOutcome,
  amount: BigDecimal,
  paymentReference: string,
  to: string
): void {
  const receipt = receiptWithOutcome.receipt;
  let payment = new Payment(generateId(receipt.id, paymentReference));
  payment.to = to;
  payment.amount = amount;
  payment.reference = paymentReference;
  payment.contractAddress = "requestnetwork.near";

  payment.from = receipt.signerId;
  payment.block = BigInt.fromI64(
    receiptWithOutcome.block.header.height - 1
  ).toI32();
  const textTimestamp = receiptWithOutcome.block.header.timestampNanosec.toString();
  const trimmedTimestamp = textTimestamp.substr(0, textTimestamp.length - 6);
  payment.timestamp = BigInt.fromString(trimmedTimestamp);
  // receipt ID can be mapped to transaction hash 1-1
  payment.receiptId = typeConversion.bytesToBase58(
    receiptWithOutcome.receipt.id
  );
  payment.gasUsed = BigInt.fromU64(receiptWithOutcome.outcome.gasBurnt);
  payment.gasPrice = receipt.gasPrice;

  payment.feeAmount = BigDecimal.zero();
  payment.save();
}
