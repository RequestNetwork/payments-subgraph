import { ByteArray, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts";

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
