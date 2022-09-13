import React, { Component, useState } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility/eligibility';
import { Signing } from './signing/signing';
import { PastRedemptions } from './pastRedemptions/pastRedemptions';
import { ClaimAndRedeem } from './claimAndRedeem/claimAndRedeem';
import { CheckOpenBorrows } from './checkOpenBorrows/checkOpenBorrows';
import './main.css';

import comptrollers from './data/comptrollers.json';
import labels from './data/labels.json';
import proofs from './data/proofs.json';
import rates from './data/rates.json';
import roots from './data/roots.json';
import snapshot from './data/snapshot.json';
// normalize all data object keys to lowercase
for (var ctokenAddress in snapshot) {
  for (var userAddress in snapshot[ctokenAddress]) {
    const amount = snapshot[ctokenAddress][userAddress];
    delete snapshot[ctokenAddress][userAddress];
    snapshot[ctokenAddress][userAddress.toLowerCase()] = amount;
  }
  const amounts = snapshot[ctokenAddress];
  delete snapshot[ctokenAddress];
  snapshot[ctokenAddress.toLowerCase()] = amounts;
}
for (var ctokenAddress in proofs) {
  for (var userAddress in proofs[ctokenAddress]) {
    const userProofs = proofs[ctokenAddress][userAddress];
    delete proofs[ctokenAddress][userAddress];
    proofs[ctokenAddress][userAddress.toLowerCase()] = userProofs;
  }
  const userProofs = proofs[ctokenAddress];
  delete proofs[ctokenAddress];
  proofs[ctokenAddress.toLowerCase()] = userProofs;
}
for (var key in comptrollers) {
  var data = comptrollers[key];
  delete comptrollers[key];
  comptrollers[key.toLowerCase()] = data;
}
for (var key in labels) {
  var data = labels[key];
  delete labels[key];
  labels[key.toLowerCase()] = data;
}
for (var key in rates) {
  var data = rates[key];
  delete rates[key];
  rates[key.toLowerCase()] = data;
}
for (var key in roots) {
  var data = roots[key];
  delete roots[key];
  roots[key.toLowerCase()] = data;
}

export default function RariHackRedeem() {
  const { address, isConnected, isDisconnected } = useAccount();
  const [eligible, setEligible] = useState(false);
  const [messageSigned, setMessageSigned] = useState(false);
  const [signedMessage, setSignedMessage] = useState(null);
  const [redeemable, setRedeemable] = useState([]);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  //// CONTRACT ADDRESS
  const contractAddress = '0xFD2Cf3b56a73c75A7535fFe44EBABe7723c64719';

  //Keep track of eligibility by updating state
  const isEligible = (check, value) => {
    if (check) {
      setEligible(true);
      setRedeemable(value);
    }
  };

  function handleRedeemed() {
    setRedeemed(true);
  }

  //Is the message signed? update message data to the main state
  const liftMessageData = (data) => {
    setMessageSigned(true);
    setSignedMessage(data);
  };

  // was the message signed before?
  const liftAlreadySigned = () => {
    setAlreadySigned(true);
  };

  // render the data
  return (
    <div className="rarihackredeem">
      <div className="card section">
        <h1 className="mb-3">Rari hack redeem</h1>
        <div className="info">
          <p>
            Pursuant to{' '}
            <a
              href="https://snapshot.org/#/fei.eth/proposal/0xd5359654b34bba833843fb64ad38e813b4ff6cc21e6f5ea323b704d2ceb25d96"
              target="_blank"
            >
              TIP-121
            </a>
            , the Tribe DAO has decided to reimburse users of the Fuse platform affected by the May 2022 hack.
          </p>
          <p>
            This interface lets you interact with the{' '}
            <a href={'https://etherscan.io/address/' + contractAddress}>smart contract deployed</a> to process the
            reimbursments.
          </p>
        </div>
        <h2>Step 1: Check your Eligibility</h2>
        {isConnected == true ? (
          <RariHackEligibility redeemed={redeemed} onCompute={isEligible} contractAddress={contractAddress} />
        ) : (
          <span className="connectprompt">Please connect your wallet.</span>
        )}

        {eligible && isConnected ? (
          <div>
            <h2>Step 2: Sign Waiver and Claim your Eligiblity</h2>
            <Signing
              liftMessageData={liftMessageData}
              liftAlreadySigned={liftAlreadySigned}
              contractAddress={contractAddress}
            />
          </div>
        ) : null}

        {messageSigned && isConnected ? (
          <div>
            <CheckOpenBorrows redeemableTokens={redeemable} />

            <h2>Step 3: Redeem your cTokens for FEI</h2>
            <ClaimAndRedeem
              redeemableTokens={redeemable}
              alreadySigned={alreadySigned}
              contractAddress={contractAddress}
              signedMessage={signedMessage}
              handleRedeemed={handleRedeemed}
            />
          </div>
        ) : null}

        <div>
          <h2>Stats: Full Eligibility List and Redemption Status</h2>
          <PastRedemptions userAddress={address} contractAddress={contractAddress} />
        </div>
      </div>
    </div>
  );
}
