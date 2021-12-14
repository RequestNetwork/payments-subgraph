import { Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  InitiatedEmergencyClaim,
  RequestFrozen,
  RevertedEmergencyClaim,
} from "../generated/ERC20EscrowToPayProxy/ERC20EscrowToPayProxy";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { EscrowEvent } from "../generated/schema";
import { createPaymentForFeeProxy } from "./erc20FeeProxy";
import { generateId } from "./shared";

/**
 * Handle the TransferWithReferenceAndFee event, emitted by the external call to the ERC20FeeProxy contract.
 * @param event
 */
export function handleTransferWithReferenceAndFee(
  event: TransferWithReferenceAndFee
): void {
  log.info("feeProxy (conversion) for tx {}", [
    event.transaction.hash.toHexString(),
  ]);
  let payment = createPaymentForFeeProxy(event);
  payment.amountInCrypto = event.params.amount.toBigDecimal();
  payment.feeAmountInCrypto = event.params.feeAmount.toBigDecimal();

  payment.save();
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
  return escrowEvent;
}

export function handleInitiatedEmergencyClaim(
  event: InitiatedEmergencyClaim
): void {
  log.info("initiatedEmergencyClaim at tx {}", [
    event.transaction.hash.toHexString(),
  ]);
  let escrowEvent = createEscrowEvent(event, event.params.paymentReference);
  escrowEvent.eventType = "initiateEmergencyClaim";
  escrowEvent.save();
}

export function handleRevertedEmergencyClaim(
  event: RevertedEmergencyClaim
): void {
  log.info("RevertedEmergencyClaim at tx {}", [
    event.transaction.hash.toHexString(),
  ]);
  let escrowEvent = createEscrowEvent(event, event.params.paymentReference);
  escrowEvent.eventType = "revertEmergencyClaim";
  escrowEvent.save();
}

export function handleRequestFrozen(event: RequestFrozen): void {
  log.info("RequestFrozen at tx {}", [event.transaction.hash.toHexString()]);
  let escrowEvent = createEscrowEvent(event, event.params.paymentReference);
  escrowEvent.eventType = "freezeEscrow";
  escrowEvent.save();
}
