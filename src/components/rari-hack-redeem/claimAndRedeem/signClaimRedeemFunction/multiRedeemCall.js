import React, { useState, useEffect } from 'react';
import { usePrepareContractWrite, useContractWrite, useBalance } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';
import EventEmitter from '../../../../modules/event-emitter';
import { formatNumber } from '../../../../modules/utils';
import imgFei from '../../../collateralization/img/fei.png';

export default function MultiRedeemCall(props) {
  const cTokensToRedeem = [];
  const amountsToRedeem = [];
  const [contractBalance, setContractBalance] = useState(0);

  /// fetching contract's current balance of FEI
  useBalance({
    addressOrName: props.contractAddress,
    token: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
    onSuccess(balance) {
      setContractBalance(balance.value.toString());
    }
  });

  props.amountsToRedeem.forEach(function (amountToRedeem, i) {
    const amountToRedeemString = BigInt(amountToRedeem).toString();
    if (amountToRedeemString != '0') {
      // need to filter out 0 values in contract call
      cTokensToRedeem.push(props.cTokens[i]);
      amountsToRedeem.push(amountToRedeemString);
    }
  });

  const { write } = useContractWrite({
    mode: 'recklesslyUnprepared',
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'multiRedeem',
    args: [cTokensToRedeem, amountsToRedeem],
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

  return (
    <div>
      {errorMessage.length ? <div style={{ color: 'red' }}>{errorMessage}</div> : null}
      <button onClick={() => write()} disabled={errorMessage.length ? true : false}>
        Redeem
      </button>
      <p className="mt-3">
        The Redeemer contract currently holds <img src={imgFei} style={{ height: '1em', verticalAlign: '-3px' }} />{' '}
        {formatNumber(contractBalance)} FEI.
      </p>
    </div>
  );
}
