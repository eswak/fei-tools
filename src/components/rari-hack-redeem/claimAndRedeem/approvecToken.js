import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useProvider, useContractWrite, usePrepareContractWrite } from 'wagmi';
import IERC20 from '../../../abi/IERC20.json';
import EventEmitter from '../../../modules/event-emitter';
import labels from '../data/labels.json';
import decimals from '../data/decimals.json';
import { formatNumber } from '../../../modules/utils';

export default function ApproveCToken(props) {
  const [loadingAllowance, setLoadingAllowance] = useState(false);
  const [currentAllowance, setCurrentAllowance] = useState(null);
  const account = useAccount().address;
  const provider = useProvider();

  // if currentAllowance is already loaded, and approve
  // state is incorrect, lift the change of state
  if (currentAllowance !== null) {
    if (Number(props.value) <= Number(currentAllowance) && !props.approved) {
      props.liftState({
        cTokenAddress: props.cTokenAddress,
        approved: true
      });
    }
    if (Number(props.value) > Number(currentAllowance) && props.approved) {
      props.liftState({
        cTokenAddress: props.cTokenAddress,
        approved: false
      });
    }
  }

  /// read onchain the allowance
  if (!loadingAllowance && currentAllowance === null) {
    setLoadingAllowance(true);
    const cToken = new ethers.Contract(props.cTokenAddress, IERC20, provider);
    cToken.allowance(account, props.contractAddress).then(function (allowance) {
      setCurrentAllowance(allowance.toString());
      if (allowance.toString() >= props.value) {
        props.liftState({
          cTokenAddress: props.cTokenAddress,
          approved: true
        });
      } else {
        props.liftState({
          cTokenAddress: props.cTokenAddress,
          approved: false
        });
      }
    });
  }

  /// Transaction to set approve
  const { config, error } = usePrepareContractWrite({
    addressOrName: props.cTokenAddress,
    contractInterface: IERC20,
    functionName: 'approve',
    args: [props.contractAddress, props.eligible],
    onError(error) {
      //console.log('Error prepareContractWrite', error);
    }
  });
  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      props.liftState({
        cTokenAddress: props.cTokenAddress,
        approved: true
      });
      setCurrentAllowance(props.value);

      // If broadcasting a new TX, display the toast
      EventEmitter.dispatch('tx', {
        hash: data.hash,
        label: 'Approve ' + formatNumber(props.eligible, decimals[props.cTokenAddress.toLowerCase()]) + ' ' + labels[props.cTokenAddress] + ' on Redeemer contract.'
      });
    }
  });

  return (
    <button
      onClick={() => write()}
      disabled={props.approved}
      title={'Expect ' + props.value + ', current allowance is ' + currentAllowance}
    >
      Approve
    </button>
  );
}
