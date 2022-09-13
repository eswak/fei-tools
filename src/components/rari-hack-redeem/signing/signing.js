import { ethers } from 'ethers';
import React, { useState } from 'react';
import { useProvider, useSignMessage, useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../abi/MultiMerkleRedeemer.json';
import snapshot from '../data/snapshot.json';
import proofs from '../data/proofs.json';
import EventEmitter from '../../../modules/event-emitter';

export function Signing(props) {
  const [signedMessage, setSignedMessage] = useState(null);
  const [pendingSignedMessage, setPendingSignedMessage] = useState(null);
  const account = useAccount();
  const provider = useProvider();
  const message = `By signing and submitting this message to the Ethereum network, I represent that I have read and agree to the Fuse Hack Settlement Agreement and Release, as set forth here: https://fusehacksettlement.com/waiver.pdf`;

  // Sign message
  let { isLoading, signMessage } = useSignMessage({
    message,
    onSettled(data, error) {
      if (error) return;
      setPendingSignedMessage(data);
    }
  });

  // Checking for past signature
  const redeemer = new ethers.Contract(props.contractAddress, MultiMerkleRedeemer, provider);
  redeemer
    .userSignatures(account.address)
    .then(function (userSignature) {
      if (userSignature === '0x') return;
      setSignedMessage(userSignature);
      props.liftMessageData(userSignature);
      props.liftAlreadySigned();
    })
    .catch((err) => {
      console.error('Error fetching user signature:', err);
    });

  // prepare for signAndClaim()
  const cTokens = [];
  const amounts = [];
  const merkleProofs = [];
  for (var cTokenAddress in snapshot) {
    for (var userAddress in snapshot[cTokenAddress]) {
      if (userAddress.toLowerCase() == account.address.toLowerCase()) {
        cTokens.push(cTokenAddress);
        amounts.push(snapshot[cTokenAddress][userAddress]);
        merkleProofs.push(proofs[cTokenAddress][userAddress]);
      }
    }
  }

  const { config } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: MultiMerkleRedeemer,
    functionName: 'signAndClaim',
    args: [(pendingSignedMessage || '0x'), cTokens, amounts, merkleProofs]
  });

  const { isLoading: isLoadingSignAndClaim, write: signAndClaim } = useContractWrite({
    ...config,
    onSuccess(data) {
      let msg = pendingSignedMessage;
      setPendingSignedMessage(null);
      setSignedMessage(msg);
      props.liftMessageData(msg);
      props.liftAlreadySigned();

      // If broadcasting a new TX, display the toast
      EventEmitter.dispatch('tx', {
        hash: data.hash,
        label: 'Sign and Claim transaction'
      });
    }
  });

  // If the user already signed in the past and commited onchain
  return (
    <div>
      {signedMessage || pendingSignedMessage ? (
        <div>
          <p>
            Your have signed the <abbr title={message}>waiver</abbr>, here is your signature :
          </p>
          <p
            style={{
              background: '#eee',
              borderLeft: '5px solid #aaa',
              padding: '5px',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace'
            }}
          >
            {pendingSignedMessage || signedMessage}
          </p>
          {pendingSignedMessage ? (
            <p>
              <button disabled={isLoadingSignAndClaim || !signAndClaim} onClick={() => signAndClaim()}>
                Commit my signature onchain in order to be able to claim my FEI
              </button>
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <p>In order to be eligible for compensation, please sign the following message:</p>
          <p style={{ background: '#eee', borderLeft: '5px solid #aaa', padding: '5px', whiteSpace: 'pre-line' }}>
            {message}
          </p>
          <div>
            <button disabled={isLoading || !signMessage} onClick={() => signMessage()}>
              Sign message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
