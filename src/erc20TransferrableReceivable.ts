import { ethereum, log } from "@graphprotocol/graph-ts";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { Payment as PaymentEvent } from "../generated/ERC20TransferrableReceivable/ERC20TransferrableReceivable";
import { Payment } from "../generated/schema";
import { createPaymentForFeeProxy } from "./erc20FeeProxy";
import { generateId } from "./shared";

//
// ERC20TransferrableReceivable calls ERC20FeeProxy internally.
// Hence, we need to first parse the ERC20FeeProxy event (TransferWithReferenceAndFee), then
// parse the Payment event
//

/**
 * Handle the TransferWithReferenceAndFee event, emitted by the external call to the ERC20FeeProxy contract.
 * @param event
 */
export function handleTransferWithReferenceAndFee(
  event: TransferWithReferenceAndFee,
): void {
  log.info("feeProxy (transferrable receivable) for tx {}", [
    event.transaction.hash.toHexString(),
  ]);
  log.info("feeProxy address {}", [event.address.toHexString()]);
  let payment = createPaymentForFeeProxy(event);

  payment.save();
}

export function handleReceivablePayment(event: PaymentEvent): void {
  log.info("receivable payment event for tx {}", [
    event.transaction.hash.toHexString(),
  ]);
  log.info("receivable address {}", [event.address.toHexString()]);
  let id = generateId(event.transaction, event.params.paymentReference);
  let payment = Payment.load(id);

  if (!payment) {
    log.error("payment entity {} should already exist. (tx: {})", [
      id,
      event.transaction.hash.toHexString(),
    ]);
    return;
  }

  // override contractAddress and amount, already set by previous handler
  payment.contractAddress = event.address;

  payment.save();
}
