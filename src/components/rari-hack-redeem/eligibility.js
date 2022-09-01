import { checkProperties } from 'ethers/lib/utils';
import React, { Component, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import redeemerAbi from '../../abi/theta.json'
import { balances, cTokens } from './balances';
import Row from './row';



export function RariHackEligibility() {
  const account = useAccount().address
  const [redeemable, setRedeemable] = useState([])


  const contractRead = useContractRead({
    addressOrName: '0x3883f5e181fccaF8410FA61e12b59BAd963fb645',
    contractInterface: redeemerAbi,
    functionName: 'balanceOf',
    args: account
  })

  function canRedeem() {
    for (let i = 0; i < cTokens.length; i++) {
      const instance = {
        cToken: cTokens[i],
        balance: balances[cTokens[i]][account]
      }
      console.log("instance is")
      console.log(instance)
      setRedeemable(redeemable => [...redeemable, instance])
      console.log("redeemable is")
      console.log(redeemable)
    }
    console.log(redeemable)
  }



  // render the data
  return (
    <div className="rarihackeligilibity">

      <span>You can withdraw {`${contractRead.data / 1e18}`} tokens</span>
      <hr />
      <p><button onClick={canRedeem}> Balances </button></p>
      <table className="mb-3">
        <thead>
          <tr>
            <th>cToken</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {redeemable.map((instance) =>{
            return <Row {... instance} />
          })}
        </tbody>
      </table>
    </div>
  );

}

export default RariHackEligibility; 