import { log } from "@graphprotocol/graph-ts";
import { TransferWithReferenceAndFee } from "../generated/ERC20FeeProxy/ERC20FeeProxy";
import { createPaymentForFeeProxy } from "./erc20FeeProxy";

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
  let payment = createPaymentForFeeProxy(event);

  payment.save();
}
