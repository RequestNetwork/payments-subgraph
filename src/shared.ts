import {
  BigDecimal,
  ByteArray,
  Bytes,
  crypto,
  ethereum,
} from "@graphprotocol/graph-ts";
import { EscrowEvent, CommerceEscrowEvent } from "../generated/schema";

export function generateId(
  transaction: ethereum.Transaction,
  paymentReference: Bytes,
): string {
  var id = transaction.hash.toHex() + paymentReference.toHex().slice(2);
  return crypto.keccak256(ByteArray.fromHexString(id)).toHex();
}

export function generateEscrowId(paymentReference: Bytes): string {
  return paymentReference.toHex();
}

export function createEscrowEvent(
  event: ethereum.Event,
  paymentReference: Bytes,
  eventName: string,
): void {
  let escrowEvent = new EscrowEvent(
    generateId(event.transaction, paymentReference),
  );
  escrowEvent.reference = paymentReference;
  escrowEvent.contractAddress = event.address;
  escrowEvent.from = event.transaction.from;
  escrowEvent.block = event.block.number.toI32();
  escrowEvent.timestamp = event.block.timestamp.toI32();
  escrowEvent.txHash = event.transaction.hash;
  escrowEvent.gasUsed = (event.receipt as ethereum.TransactionReceipt).gasUsed;
  escrowEvent.gasPrice = event.transaction.gasPrice;
  escrowEvent.escrow = generateEscrowId(paymentReference);
  escrowEvent.eventName = eventName;
  escrowEvent.save();
}

// Commerce Escrow helper functions

export function generateCommerceEscrowId(paymentReference: Bytes): string {
  return "commerce-" + paymentReference.toHex();
}

export function generateCommerceEscrowEventId(
  transaction: ethereum.Transaction,
  paymentReference: Bytes,
): string {
  var id =
    "commerce-" + transaction.hash.toHex() + paymentReference.toHex().slice(2);
  return crypto.keccak256(ByteArray.fromHexString(id)).toHex();
}

export function createCommerceEscrowEvent(
  event: ethereum.Event,
  paymentReference: Bytes,
  eventName: string,
  amount: BigDecimal | null,
): void {
  let escrowEvent = new CommerceEscrowEvent(
    generateCommerceEscrowEventId(event.transaction, paymentReference),
  );
  escrowEvent.reference = paymentReference;
  escrowEvent.contractAddress = event.address;
  escrowEvent.from = event.transaction.from;
  escrowEvent.block = event.block.number.toI32();
  escrowEvent.timestamp = event.block.timestamp.toI32();
  escrowEvent.txHash = event.transaction.hash;
  escrowEvent.gasUsed = (event.receipt as ethereum.TransactionReceipt).gasUsed;
  escrowEvent.gasPrice = event.transaction.gasPrice;
  escrowEvent.escrow = generateCommerceEscrowId(paymentReference);
  escrowEvent.eventName = eventName;
  escrowEvent.amount = amount;
  escrowEvent.save();
}
