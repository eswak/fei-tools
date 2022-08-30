import React, { Component } from 'react';
import { useAccount } from 'wagmi';
import RariHackEligibility from './eligibility';



export default function RariHackRedeem() {

  const {address, isConnected, isDisconnected} = useAccount()



  // render the data
    return (
      <div className="rarihackredeem">
        <div className="card section">
          <h1 className="mb-3">Rari hack redeem</h1>
          <div className="info">
            <p>
              pursuant to  <a href="https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475/37" target="_blank">
              TIP-121
              </a> the Tribe DAO has decided to make whole retail investors affected by the RARI hack.
            </p>
            <p>
                This interface lets you interact with the smart contract deployed to process the reimbursments.
            </p>
          </div>
          <hr />
          {isConnected == true ? <RariHackEligibility/> : <span>Please connect your wallet</span>}
        </div>
      </div>
    );
  }
