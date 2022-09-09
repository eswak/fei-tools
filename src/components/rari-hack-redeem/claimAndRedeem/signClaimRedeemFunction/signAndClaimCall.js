import React from 'react';
import { useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../../abi/MultiMerkleRedeemer.json';

export default function SignAndClaim(props) {

  /// Transaction to sign and claim
  const account = useAccount().address;

  const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'signAndClaim',
    args: [props.signedMessage, props.cTokens, props.amountsToClaim, props.merkleProofs],
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
      Claim and Redeem
    </button>
  );
}