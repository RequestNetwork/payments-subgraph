import { log } from "@graphprotocol/graph-ts";
import { TransferWithConversionAndReference } from "../generated/EthConversionProxy_0_2_0/EthConversionProxy_0_2_0";
import { TransferWithReferenceAndFee } from "../generated/EthFeeProxy_0_2_0/EthFeeProxy_0_2_0";
import { createPaymentForFeeProxy } from "./ethFeeProxy";
import { Payment } from "../generated/schema";
import { generateId } from "./shared";

//
// ETHConversionProxy calls ETHFeeProxy internally.
// Hence, we need to first parse the ETHFeeProxy event (TransferWithReferenceAndFee), then
// parse the TransferWithConversionAndReference event
//

/**
 * Handle the TransferWithReferenceAndFee event, emitted by the external call to the ETHFeeProxy contract.
 * @param event
 */

export function handleTransferWithReferenceAndFee(
  event: TransferWithReferenceAndFee,
): void {
  log.info("ethProxy for tx {}", [event.transaction.hash.toHexString()]);
  let payment = createPaymentForFeeProxy(event);
  payment.amountInCrypto = event.params.amount.toBigDecimal();
  payment.feeAmountInCrypto = event.params.feeAmount.toBigDecimal();
  payment.save();
}

/**
 * Handle the TransferWithConversionAndReference event, emitted by EthConversionProxy
 * Here we expect the payment to be already created by the event handler above
 * @param event
 */

export function handleTransferWithConversionAndReference(
  event: TransferWithConversionAndReference,
): void {
  log.info("ethConversionProxy for tx {}", [event.transaction.hash.toHex()]);
  let id = generateId(event.transaction, event.params.paymentReference);
  let payment = Payment.load(id);

  if (!payment) {
    log.error("payment entity {} should already exist. (tx: {})", [
      id,
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  payment.contractAddress = event.address;
  payment.amount = event.params.amount.toBigDecimal();

  payment.currency = event.params.currency;
  payment.feeAmount = event.params.feeAmount.toBigDecimal();
  payment.maxRateTimespan = event.params.maxRateTimespan.toI32();

  payment.save();
}
