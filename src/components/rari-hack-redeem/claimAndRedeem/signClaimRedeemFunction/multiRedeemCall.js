import React from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';

export default function MultiRedeemCall(props) {
  /// Transaction to sign and claim and redeem
  const account = useAccount().address;

  const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'multiRedeem',
    args: [props.cTokens, props.amountsToRedeem],
    onError(error) {
      console.log('Error prepareContractWrite', error);
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
    }
  });

  return (
    <button onClick={() => write()} disabled={props.disable}>
      {' '}
      Redeem{' '}
    </button>
  );
}