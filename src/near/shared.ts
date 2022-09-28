import { Bytes, crypto, ByteArray, near, log } from "@graphprotocol/graph-ts";

export function generateId(
  transactionHash: Bytes,
  paymentReference: string,
): string {
  var id = transactionHash.toHex() + paymentReference;
  return crypto.keccak256(ByteArray.fromHexString(id)).toHex();
}
