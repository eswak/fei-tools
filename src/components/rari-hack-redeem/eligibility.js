import React, { Component, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import redeemerAbi from '../../abi/theta.json'



export function RariHackEligibility() {
    const account = useAccount().address

    const contractRead = useContractRead({
        addressOrName: '0x3883f5e181fccaF8410FA61e12b59BAd963fb645',
        contractInterface: redeemerAbi,
        functionName: 'balanceOf',
        args: account
      })
    


  // render the data
    return (
      <div className="rarihackeligilibity">
        
        <span>You can withdraw {`${contractRead.data/1e18}`} tokens</span>
      </div>
    );

}

export default RariHackEligibility; 