import { checkProperties } from 'ethers/lib/utils';
import React, { Component, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { balances, cTokens } from './balances';
import Row from './row';



export function RariHackEligibility() {
  const account = useAccount().address
  const [redeemable, setRedeemable] = useState([])
  const [loaded, setLoaded] = useState(false)


  // finding out what the user can redeem
  function canRedeem() {
    if(!loaded){
    for (let i = 0; i < cTokens.length; i++) {
      const instance = {
        cToken: cTokens[i],
        balance: balances[cTokens[i]][account]
      }
      setRedeemable(redeemable => [...redeemable, instance])
    }
    setLoaded(true)
  }
  }

  // render the data
  return (
    <div className="rarihackeligilibity">
      <p><button onClick={canRedeem}> Balances </button></p>
      <table className="mb-3">
        <thead>
          <tr>
            <th>cToken</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {redeemable.map((instance, i) =>{
            console.log(instance)
            return <Row key={i} cToken={instance.cToken} balance={instance.balance} />
          })}
        </tbody>
      </table>
    </div>
  );

}

export default RariHackEligibility; 