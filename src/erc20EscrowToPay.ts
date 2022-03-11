import { Bytes, log } from "@graphprotocol/graph-ts";
import {
  InitiatedEmergencyClaim,
  RequestFrozen,
  RevertedEmergencyClaim,
} from "../generated/ERC20EscrowToPay/ERC20EscrowToPay";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { Escrow } from "../generated/schema";
import { ERC20EscrowToPay } from "../generated/ERC20EscrowToPay/ERC20EscrowToPay";
import { createPaymentForFeeProxy } from "./erc20FeeProxy";
import { generateEscrowId, createEscrowEvent } from "./shared";

/**
 * Handle the TransferWithReferenceAndFee event, emitted by the external call to the ERC20FeeProxy contract.
 * @param event
 */
export function handleTransferWithReferenceAndFee(
  event: TransferWithReferenceAndFee,
): void {
  log.info("Init escrow at tx {}", [event.transaction.hash.toHexString()]);
  let payment = createPaymentForFeeProxy(event);
  payment.amountInCrypto = event.params.amount.toBigDecimal();
  payment.feeAmountInCrypto = event.params.feeAmount.toBigDecimal();
  payment.save();
  let paymentReference = event.params.paymentReference;
  let escrowId = generateEscrowId(paymentReference);
  let escrow = Escrow.load(escrowId);
  if (escrow == null) {
    let escrowContract = ERC20EscrowToPay.bind(event.address);
    escrow = new Escrow(escrowId);
    escrow.contractAddress = event.address;
    escrow.paymentProxyAddress = escrowContract.paymentProxy();
    escrow.reference = paymentReference;
    escrow.creationBlock = event.block.number.toI32();
    escrow.creationTimestamp = event.block.timestamp.toI32();
    escrow.tokenAddress = event.params.tokenAddress;
    escrow.amount = event.params.amount.toBigDecimal();
    escrow.feeAmount = event.params.feeAmount.toBigDecimal();
    escrow.feeAddress = event.params.feeAddress;
    escrow.escrowState = "paidEscrow";
    escrow.payer = event.transaction.from;
    escrow.save();
  }
  createEscrowEvent(event, event.params.paymentReference, "paidEscrow");
}

function updateEscrowState(paymentReference: Bytes, eventType: string): void {
  let escrow = Escrow.load(generateEscrowId(paymentReference));
  escrow.escrowState = eventType;
  escrow.save();
}

export function handleInitiatedEmergencyClaim(
  event: InitiatedEmergencyClaim,
): void {
  log.info("initiatedEmergencyClaim at tx {} for {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);
  createEscrowEvent(
    event,
    event.params.paymentReference,
    "initiateEmergencyClaim",
  );
  updateEscrowState(event.params.paymentReference, "emergency");
}

export function handleRevertedEmergencyClaim(
  event: RevertedEmergencyClaim,
): void {
  log.info("RevertedEmergencyClaim at tx {} for {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);
  createEscrowEvent(
    event,
    event.params.paymentReference,
    "revertEmergencyClaim",
  );
  updateEscrowState(event.params.paymentReference, "paidEscrow");
}

export function handleRequestFrozen(event: RequestFrozen): void {
  log.info("RequestFrozen at tx {} for {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);
  createEscrowEvent(event, event.params.paymentReference, "freezeEscrow");
  updateEscrowState(event.params.paymentReference, "frozen");
}
