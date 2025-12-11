import { Bytes, log } from "@graphprotocol/graph-ts";
import {
  PaymentAuthorized,
  PaymentCaptured,
  PaymentCharged,
  PaymentVoided,
  PaymentReclaimed,
  PaymentRefunded,
} from "../generated/ERC20CommerceEscrowWrapper/ERC20CommerceEscrowWrapper";
import { CommerceEscrow, CommerceEscrowEvent } from "../generated/schema";
import {
  generateCommerceEscrowId,
  generateCommerceEscrowEventId,
  createCommerceEscrowEvent,
} from "./shared";

/**
 * Handle the PaymentAuthorized event - creates a new commerce escrow
 */
export function handlePaymentAuthorized(event: PaymentAuthorized): void {
  log.info("PaymentAuthorized at tx {} for reference {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);

  let paymentReference = Bytes.fromHexString(
    event.params.paymentReference.toHexString(),
  );
  let escrowId = generateCommerceEscrowId(paymentReference);
  let escrow = CommerceEscrow.load(escrowId);

  if (escrow == null) {
    escrow = new CommerceEscrow(escrowId);
    escrow.contractAddress = event.address;
    escrow.reference = paymentReference;
    escrow.commercePaymentHash = event.params.commercePaymentHash;
    escrow.creationBlock = event.block.number.toI32();
    escrow.creationTimestamp = event.block.timestamp.toI32();
    escrow.tokenAddress = event.params.token;
    escrow.amount = event.params.amount.toBigDecimal();
    escrow.payer = event.params.payer;
    escrow.merchant = event.params.merchant;
    escrow.escrowState = "authorized";
    escrow.save();
  }

  createCommerceEscrowEvent(event, paymentReference, "authorized", null);
}

/**
 * Handle the PaymentCaptured event - updates escrow state to captured
 */
export function handlePaymentCaptured(event: PaymentCaptured): void {
  log.info("PaymentCaptured at tx {} for reference {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);

  let paymentReference = Bytes.fromHexString(
    event.params.paymentReference.toHexString(),
  );
  updateCommerceEscrowState(paymentReference, "captured");
  createCommerceEscrowEvent(
    event,
    paymentReference,
    "captured",
    event.params.capturedAmount.toBigDecimal(),
  );
}

/**
 * Handle the PaymentVoided event - updates escrow state to voided
 */
export function handlePaymentVoided(event: PaymentVoided): void {
  log.info("PaymentVoided at tx {} for reference {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);

  let paymentReference = Bytes.fromHexString(
    event.params.paymentReference.toHexString(),
  );
  updateCommerceEscrowState(paymentReference, "voided");
  createCommerceEscrowEvent(
    event,
    paymentReference,
    "voided",
    event.params.voidedAmount.toBigDecimal(),
  );
}

/**
 * Handle the PaymentCharged event - creates a new commerce escrow in charged state
 */
export function handlePaymentCharged(event: PaymentCharged): void {
  log.info("PaymentCharged at tx {} for reference {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);

  let paymentReference = Bytes.fromHexString(
    event.params.paymentReference.toHexString(),
  );
  let escrowId = generateCommerceEscrowId(paymentReference);
  let escrow = CommerceEscrow.load(escrowId);

  let escrow = CommerceEscrow.load(escrowId);

  if (escrow == null) {
    escrow = new CommerceEscrow(escrowId);
    escrow.contractAddress = event.address;
    escrow.reference = paymentReference;
    escrow.commercePaymentHash = event.params.commercePaymentHash;
    escrow.creationBlock = event.block.number.toI32();
    escrow.creationTimestamp = event.block.timestamp.toI32();
    escrow.tokenAddress = event.params.token;
    escrow.amount = event.params.amount.toBigDecimal();
    escrow.payer = event.params.payer;
    escrow.merchant = event.params.merchant;
  }
  escrow.escrowState = "charged";
  escrow.save();

  createCommerceEscrowEvent(
    event,
    paymentReference,
    "charged",
    event.params.amount.toBigDecimal(),
  );
}

/**
 * Handle the PaymentReclaimed event - updates escrow state to reclaimed
 */
export function handlePaymentReclaimed(event: PaymentReclaimed): void {
  log.info("PaymentReclaimed at tx {} for reference {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);

  let paymentReference = Bytes.fromHexString(
    event.params.paymentReference.toHexString(),
  );
  updateCommerceEscrowState(paymentReference, "reclaimed");
  createCommerceEscrowEvent(
    event,
    paymentReference,
    "reclaimed",
    event.params.reclaimedAmount.toBigDecimal(),
  );
}

/**
 * Handle the PaymentRefunded event - updates escrow state to refunded
 */
export function handlePaymentRefunded(event: PaymentRefunded): void {
  log.info("PaymentRefunded at tx {} for reference {}", [
    event.transaction.hash.toHexString(),
    event.params.paymentReference.toHexString(),
  ]);

  let paymentReference = Bytes.fromHexString(
    event.params.paymentReference.toHexString(),
  );
  updateCommerceEscrowState(paymentReference, "refunded");
  createCommerceEscrowEvent(
    event,
    paymentReference,
    "refunded",
    event.params.refundedAmount.toBigDecimal(),
  );
}

/**
 * Helper function to update commerce escrow state
 */
function updateCommerceEscrowState(
  paymentReference: Bytes,
  eventType: string,
): void {
  let escrow = CommerceEscrow.load(generateCommerceEscrowId(paymentReference));
  if (!escrow) return;
  escrow.escrowState = eventType;
  escrow.save();
}

