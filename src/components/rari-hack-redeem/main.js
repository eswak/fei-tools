import React, { Component, useState } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility/eligibility';
import { SigningMessage } from './SigningMessage/signing';
import { ClaimAndRedeem } from './claimAndRedeem/claimAndRedeem';
import { PastRedemptions } from './pastRedemptions/pastRedemptions';
import './main.css'



export default function RariHackRedeem() {

  const { address, isConnected, isDisconnected } = useAccount()
  const [eligible, setEligible] = useState(false)
  const [messageSigned, setMessageSigned] = useState(false)
  const [signedMessage, setSignedMessage] = useState(null)
  const [redeemable, setRedeemable] = useState([])

  //// CONTRACT ADDRESS
  const contractAddress = "0xfd2cf3b56a73c75a7535ffe44ebabe7723c64719"

  //Keep track of eligibility by updating state
  const isEligible = (check, value) => {
    if (check) {
      setEligible(true)
      setRedeemable(value)
    }
  }

  //Is the message signed? update message data to the main state
  const liftMessageData = (data) => {
    setMessageSigned(true)
    setSignedMessage(data)

  }



  // render the data
  return (
    <div className="rarihackredeem">
      <div className="card section">
        <h1 className="mb-3">Rari hack redeem</h1>
        <div className="info">
          <p>
            Pursuant to  <a href="https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475/37" target="_blank">
              TIP-121
            </a> the Tribe DAO has decided to make whole retail investors affected by the RARI hack.
          </p>
          <p>
            This interface lets you interact with the smart contract deployed to process the reimbursments.
          </p>
        </div>
        <h2>Eligibility</h2>
        {isConnected == true ?
          <RariHackEligibility onCompute={isEligible} />
          :
          <span className='connectprompt'>Please connect your wallet.</span>}

        {eligible ?
          <div>
            <h2>Signing message</h2>
            <SigningMessage liftMessageData={liftMessageData} />
          </div>
          :
          null}

        {messageSigned ?
          <div>
            <h2>Claim and redeem</h2>
            <ClaimAndRedeem redeemableTokens={redeemable} contractAddress={contractAddress} signedMessage={signedMessage}/>
          </div> : null}
          <br/>
          <br/>
          <hr/>
          
          <div>
            <h2>Redemption stats</h2>
            <PastRedemptions userAddress={address}/>
          </div>
      </div>
    </div>
  );
}
