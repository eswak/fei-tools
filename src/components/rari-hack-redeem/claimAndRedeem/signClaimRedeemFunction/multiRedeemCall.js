import React, { useEffect, useState } from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';
import EventEmitter from '../../../../modules/event-emitter';
import { formatNumber } from '../../../../modules/utils';

let timeoutRefresh;
export default function MultiRedeemCall(props) {
  const [random, setRandom] = useState(Math.random());
  const cTokensToRedeem = [];
  const amountsToRedeem = [];
  props.amountsToRedeem.forEach(function (amountToRedeem, i) {
    const amountToRedeemString = BigInt(amountToRedeem).toString();
    if (amountToRedeemString != '0') {
      // need to filter out 0 values in contract call
      cTokensToRedeem.push(props.cTokens[i]);
      amountsToRedeem.push(amountToRedeemString);
    }
  });

  // refresh the component every few seconds
  if (timeoutRefresh) clearTimeout(timeoutRefresh);
  timeoutRefresh = setTimeout(() => {
    setRandom(Math.random());
  }, 3000);

  const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'multiRedeem',
    args: [cTokensToRedeem, amountsToRedeem]
  });
  console.log('usePrepareContractWrite error for multiRedeem', error);

  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      let redeemed = [];
      cTokensToRedeem.forEach(function (cTokensToRedeem, i) {
        const instance = {
          cToken: cTokensToRedeem,
          amount: amountsToRedeem[i]
        };
        redeemed.push(instance);
      });
      props.handleRedeemed(redeemed);

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
      <button onClick={() => write()} disabled={errorMessage.length ? true : false}>
        Redeem
      </button>
    </div>
  );
}
