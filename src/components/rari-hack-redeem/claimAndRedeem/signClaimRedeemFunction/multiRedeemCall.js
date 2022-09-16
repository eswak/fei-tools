import React, { useState } from 'react';
import { usePrepareContractWrite, useContractWrite, useBalance } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';
import EventEmitter from '../../../../modules/event-emitter';
import { formatNumber } from '../../../../modules/utils';

export default function MultiRedeemCall(props) {
  const cTokensToRedeem = [];
  const amountsToRedeem = [];
  const [contractBalance, setContractBalance] = useState(0);


  /// fetching contract's current balance of FEI
  const {contractBal} = useBalance({
    addressOrName: "0xfafc562265a49975e8b20707eac966473795cf90",
    token: "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
    onSuccess(contractBal){
        setContractBalance(Math.round(contractBal.formatted));
    }
})


  props.amountsToRedeem.forEach(function (amountToRedeem, i) {
    const amountToRedeemString = BigInt(amountToRedeem).toString();
    if (amountToRedeemString != '0') {
      // need to filter out 0 values in contract call
      cTokensToRedeem.push(props.cTokens[i]);
      amountsToRedeem.push(amountToRedeemString);
    }
  });

  const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'multiRedeem',
    args: [cTokensToRedeem, amountsToRedeem]
  });

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
  console.log('errorMessage', errorMessage);

  return (
    <div>
      {errorMessage.length ? <div style={{ color: 'red' }}>{errorMessage}</div> : null}
      <button onClick={() => write()} disabled={errorMessage.length ? true : false}>
        Redeem
      </button>
      <div>
        <text>The contract currently holds {contractBalance} FEI.</text>
      </div>
    </div>
  );
}
