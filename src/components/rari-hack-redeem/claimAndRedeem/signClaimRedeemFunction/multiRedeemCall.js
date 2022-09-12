import React, { useState } from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';

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
    onError(error) {
      console.log('error', error);
    },
    onSettled(data, error) {
      console.log('settled', data, error);
    },
    onSuccess(data) {
      console.log('success', data);
      props.handleRedeemed();
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
