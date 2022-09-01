import React, { Component } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility/eligibility';



export default function RariHackRedeem() {

  const {address, isConnected, isDisconnected} = useAccount()



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
          {isConnected == true ? <RariHackEligibility/> : <span className='connectprompt'>Please connect your wallet.</span>}
          <h2>Signing message</h2>
          <p><span>Please sign the following message:</span></p>
          <p><span>"I love the Fei Labs team and will never ever even consider taking legal actions against Fei Labs or anyone even remotely associated with it, so help me God."</span></p>
        </div>
      </div>
    );
  }
