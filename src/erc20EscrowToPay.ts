import { Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  InitiatedEmergencyClaim,
  RequestFrozen,
  RevertedEmergencyClaim,
} from "../generated/ERC20EscrowToPayProxy/ERC20EscrowToPayProxy";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { Escrow, EscrowEvent } from "../generated/schema";
import { createPaymentForFeeProxy } from "./erc20FeeProxy";
import { generateId, generateEscrowId } from "./shared";

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
  let paymentReference = event.params.paymentReference;
  let escrowId = generateEscrowId(paymentReference);
  let escrow = Escrow.load(escrowId);
  if (escrow == null) {
    escrow = new Escrow(escrowId);
    escrow.contractAddress = event.address;
    escrow.reference = paymentReference;
    escrow.creationBlock = event.block.number.toI32();
    escrow.creationTimestamp = event.block.timestamp.toI32();
    escrow.tokenAddress = event.params.tokenAddress;
    escrow.amount = event.params.amount.toBigDecimal();
    escrow.feeAmount = event.params.feeAmount.toBigDecimal();
    escrow.feeAddress = event.params.feeAddress;

    escrow.escrowState = "inEscrow";
    escrow.payer = event.transaction.from;
  } else {
    if (event.params.to !== escrow.payer) {
      escrow.payee = event.params.to;
    }
    escrow.escrowState = "closed";
  }
  escrow.save();
}

function updateEscrow(paymentReference: Bytes, eventType: string): void {
  let escrow = Escrow.load(generateEscrowId(paymentReference));
  escrow.escrowState = eventType;
  escrow.save();
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
  log.info("initiatedEmergencyClaim at tx {} for {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);
  let escrowEvent = createEscrowEvent(event, event.params.paymentReference);
  escrowEvent.eventType = "initializeEmergencyClaim";
  escrowEvent.save();
  updateEscrow(event.params.paymentReference, "inEmergency");
}

export function handleRevertedEmergencyClaim(
  event: RevertedEmergencyClaim
): void {
  log.info("RevertedEmergencyClaim at tx {} for {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);
  let escrowEvent = createEscrowEvent(event, event.params.paymentReference);
  escrowEvent.eventType = "revertEmergencyClaim";
  escrowEvent.save();
  updateEscrow(event.params.paymentReference, "inEscrow");
}

export function handleRequestFrozen(event: RequestFrozen): void {
  log.info("RequestFrozen at tx {} for {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);
  let escrowEvent = createEscrowEvent(event, event.params.paymentReference);
  escrowEvent.eventType = "freezeEscrow";
  escrowEvent.save();
  updateEscrow(event.params.paymentReference, "inFrozen");
}
