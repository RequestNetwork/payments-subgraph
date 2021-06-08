import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { TransferWithConversionAndReference } from "../generated/ERC20ConversionProxy/ERC20ConversionProxy";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { Payment } from "../generated/schema";
import { createPaymentForFeeProxy } from "./erc20FeeProxy";
import { generateId } from "./shared";

//
// ERC20ConversionProxy calls ERC20FeeProxy internally.
// Hence, we need to first parse the ERC20FeeProxy event (TransferWithReferenceAndFee), then
// parse the TransferWithConversionAndReference event
//

/**
 * Handle the TransferWithReferenceAndFee event, emitted by the external call to the ERC20FeeProxy contract.
 * @param event
 */
export function handleTransferWithReferenceAndFee(
  event: TransferWithReferenceAndFee
): void {
  log.info("feeProxy (conversion) for tx {}", [
    event.transaction.hash.toHexString()
  ]);
  let payment = createPaymentForFeeProxy(event);
  payment.feeAmountInCrypto = event.params.feeAmount.toBigDecimal();
  payment.feeAddress = event.params.feeAddress;

  payment.save();
}

export function handleTransferWithConversionAndReference(
  event: TransferWithConversionAndReference
): void {
  log.info("conversionProxy for tx {}", [event.transaction.hash.toHexString()]);
  let id = generateId(event.transaction, event.params.paymentReference);
  let payment = Payment.load(id);

  if (!payment) {
    log.error("payment entity {} should already exist. (tx: {})", [
      id,
      event.transaction.hash.toHexString()
    ]);
    return;
  }
  // override contractAddress and amount, already set by previous handler
  payment.contractAddress = event.address;
  payment.amount = event.params.amount.toBigDecimal();

  payment.currency = event.params.currency;
  payment.feeAmount = event.params.feeAmount.toBigDecimal();
  payment.maxRateTimespan = event.params.maxRateTimespan.toI32();

  payment.save();
}
