import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useProvider, useContractWrite, usePrepareContractWrite } from 'wagmi';
import IERC20 from '../../../abi/IERC20.json';

export default function ApproveCToken(props) {
  const [loadingAllowance, setLoadingAllowance] = useState(false);
  const [currentAllowance, setCurrentAllowance] = useState(null);
  const account = useAccount().address;
  const provider = useProvider();

  // if currentAllowance is already loaded, and approve
  // state is incorrect, lift the change of state
  if (currentAllowance !== null) {
    if (props.value <= currentAllowance && !props.approved) {
      props.liftState({
        cTokenAddress: props.cTokenAddress,
        approved: true
      });
    }
    if (props.value > currentAllowance && props.approved) {
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
    cToken.allowance(account, props.contractAddress).then(function(allowance) {
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
    args: [props.contractAddress, props.value],
    onError(error) {
      //console.log('Error prepareContractWrite', error);
    }
  });
  const { signData, signIsLoading, signIsSuccess, write } = useContractWrite({
    ...config,
    onError(error) {
      console.log('error', error);
    },
    onSettled(data, error) {
      console.log('settled', data, error);
    },
    onSuccess(data) {
      console.log('success', data);
      props.liftState({
        cTokenAddress: props.cTokenAddress,
        approved: true
      });
      setCurrentAllowance(props.value);
    }
  });

  return (
    <button onClick={() => write()} disabled={props.approved}>
      Approve
    </button>
  );
}
