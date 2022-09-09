import React, { Component, useState } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility/eligibility';
import { Signing } from './signing/signing';
import { ApproveTable } from './approve/approveTable';
import { PastRedemptions } from './pastRedemptions/pastRedemptions';
import './main.css';
import { ClaimAndRedeem } from './claimAndRedeem/claimAndRedeem';
import { CheckOpenBorrows } from './checkOpenBorrows/checkOpenBorrows';

export default function RariHackRedeem() {
  const { address, isConnected, isDisconnected } = useAccount();
  const [eligible, setEligible] = useState(false);
  const [messageSigned, setMessageSigned] = useState(false);
  const [signedMessage, setSignedMessage] = useState(null);
  const [redeemable, setRedeemable] = useState([]);
  const [alreadySigned, setAlreadySigned] = useState(false);

  //// CONTRACT ADDRESS
  const contractAddress = '0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd';

  //Keep track of eligibility by updating state
  const isEligible = (check, value) => {
    if (check) {
      setEligible(true);
      setRedeemable(value);
    }
  };

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
          <RariHackEligibility onCompute={isEligible} contractAddress={contractAddress} />
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
