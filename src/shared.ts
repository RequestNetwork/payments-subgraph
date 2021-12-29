import { ByteArray, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts";
import { EscrowEvent } from "../generated/schema";

export function generateId(
  transaction: ethereum.Transaction,
  paymentReference: Bytes
): string {
  var id = transaction.hash.toHex() + paymentReference.toHex().slice(2);
  return crypto.keccak256(ByteArray.fromHexString(id)).toHex();
}

export function generateEscrowId(paymentReference: Bytes): string {
  return paymentReference.toHex();
}

export function createEscrowEvent(
  event: ethereum.Event,
  paymentReference: Bytes
): EscrowEvent {
  let escrowEvent = new EscrowEvent(
    generateId(event.transaction, paymentReference)
  );
  escrowEvent.reference = paymentReference;
  escrowEvent.contractAddress = event.address;
  escrowEvent.from = event.transaction.from;
  escrowEvent.block = event.block.number.toI32();
  escrowEvent.timestamp = event.block.timestamp.toI32();
  escrowEvent.txHash = event.transaction.hash;
  escrowEvent.gasUsed = event.transaction.gasUsed;
  escrowEvent.gasPrice = event.transaction.gasPrice;
  escrowEvent.escrow = generateEscrowId(paymentReference);
  return escrowEvent;
}
