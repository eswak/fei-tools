import React from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';

export default function FullCall(props) {
  console.log('cTokens are', props.cTokens);
  console.log('merkleproofs are', JSON.stringify(props.merkleProofs, null, 2));

  /// Transaction to sign and claim and redeem
  const account = useAccount().address;

  const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'signAndClaimAndRedeem',
    args: [props.signedMessage, props.cTokens, props.amountsToClaim, props.amountsToRedeem, props.merkleProofs],
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

  return <button onClick={() => write()}> Claim and Redeem </button>;
}
