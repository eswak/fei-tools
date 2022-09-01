import React, { Component, useState } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility/eligibility';
import { SigningMessage } from './signing';



export default function RariHackRedeem() {

  const { address, isConnected, isDisconnected } = useAccount()
  const [eligible, setEligible] = useState(false)
  const [messageSigned, setMessageSigned] = useState(false)
  console.log(eligible)

  //Keep track of eligibility
  const isEligible = (check) => {
    console.log(check)
    if(check){
    setEligible(true)}
  }

  //Is the message signed?
  const messageIsSigned = () => {
    setMessageSigned(true)
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
        {isConnected == true ? <RariHackEligibility onCompute={isEligible} /> : <span className='connectprompt'>Please connect your wallet.</span>}
        {eligible ? <div><h2>Signing message</h2>
          <SigningMessage onMessageReturn={setMessageSigned} />
        </div> : null}
      </div>
    </div>
  );
}
