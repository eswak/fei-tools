import React, { Component, useState } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility/eligibility';
import { Signing } from './signing/signing';
import { PastRedemptions } from './pastRedemptions/pastRedemptions';
import { Redeem } from './redeem/redeem';
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
  const [redeemed, setRedeemed] = useState([]);
  const [reloadStats, setReloadStats] = useState(false);

  //// CONTRACT ADDRESS
  const contractAddress = '0xCAe4210e6676727EA4e0fD9BA5dFb95831356a16';

  //Keep track of eligibility by updating state
  const isEligible = (check, value) => {
    if (check) {
      setEligible(true);
      setRedeemable(value);
      setReloadStats(!reloadStats);
    }
  };

  function handleRedeemed(data) {
    setRedeemed(data);
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
        <p>
          Please go to <a href="https://fusehacksettlement.com/">fusehacksettlement.com</a> to redeem your cTokens for FEI.
        </p>
        <p>
          <a href="https://fusehacksettlement.com/">
            <button className="btn btn-primary">Go to fusehacksettlement.com</button>
          </a>
        </p>
        
        <h2>Stats: Full Eligibility List and Redemption Status</h2>
        <PastRedemptions userAddress={address} contractAddress={contractAddress} reloadStats={reloadStats} />
      </div>
    </div>
  );

  // render the data
  return (
    <div className="rarihackredeem">
      <div className="card section">
        <h1 className="mb-3">Rari hack redeem</h1>
        <div className="info">
          <p>
            Pursuant to{' '}
            <a
              href="https://www.tally.xyz/governance/eip155:1:0x0BEF27FEB58e857046d630B2c03dFb7bae567494/proposal/18409504155893955395764219200342193055990239653098975117323864343432865890837"
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
          <p>
            If you are eligible (check the table below), you will be able to exchange your cTokens (Fuse pool deposit tokens) in exchange for FEI. Your full cToken balance might not be eligible for exchange to FEI if the Fuse pool where you deposited has "good debt" (tokens owed by other users). In this case, you will be able to withdraw your remaining collateral when other users repay their debt. You will have to close all your outstanding debts in Fuse in order to be able to transfer your cTokens to the redeemer contract.
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
            <Redeem
              redeemableTokens={redeemable}
              alreadySigned={alreadySigned}
              contractAddress={contractAddress}
              signedMessage={signedMessage}
              handleRedeemed={handleRedeemed}
            />
          </div>
        ) : null}

        <div className="mt-3">
          <h2>Stats: Full Eligibility List and Redemption Status</h2>
          <PastRedemptions userAddress={address} contractAddress={contractAddress} reloadStats={reloadStats} />
        </div>
      </div>
    </div>
  );
}
