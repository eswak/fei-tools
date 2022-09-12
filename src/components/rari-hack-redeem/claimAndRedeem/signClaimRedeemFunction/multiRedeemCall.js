import React, { useState } from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';
import EventEmitter from '../../../../modules/event-emitter';
import { formatNumber } from '../../../../modules/utils';

export default function MultiRedeemCall(props) {
  
  const cTokensToRedeem = [];
  const amountsToRedeem = [];
  props.amountsToRedeem.forEach(function(amountToRedeem, i) {
    const amountToRedeemString = BigInt(amountToRedeem).toString();
    if (amountToRedeemString != '0') { // need to filter out 0 values in contract call
      cTokensToRedeem.push(props.cTokens[i]);
      amountsToRedeem.push(amountToRedeemString);
    }
  });

  const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'multiRedeem',
    args: [cTokensToRedeem, amountsToRedeem],
    onError(error) {
      //console.log('Error prepareContractWrite', error);
    }
  });

  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      props.handleRedeemed();

      // If broadcasting a new TX, display the toast
      EventEmitter.dispatch('tx', {
        hash: data.hash,
        label: 'Redeem cTokens for ' + formatNumber(redeemingTotalFei) + ' FEI'
      });
    }
  });

  let errorMessage = '';
  if (!props.allApproved) errorMessage = 'You must approve all cTokens before redeeming.';
  else if (!Number(props.redeemingTotalFei)) errorMessage = 'You cannot redeem 0 FEI.';
  else if (error)
    errorMessage = error.reason.replace('execution reverted', 'The transaction will revert with the following error');

  return (
    <div>
      {errorMessage.length ? <div style={{ color: 'red' }}>{errorMessage}</div> : null}
      <button onClick={() => write()} disabled={!write || errorMessage.length != 0}>
        Redeem
      </button>
    </div>
  );
}
