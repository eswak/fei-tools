import { checkProperties } from 'ethers/lib/utils';
import React, { Component, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { balances, cTokens, cTokensLabels } from './balances';
import Row from './row';



export function RariHackEligibility(props) {
  const account = useAccount().address
  const [redeemable, setRedeemable] = useState([])
  const [loaded, setLoaded] = useState(false)
  console.log(props.onCompute)


  // finding out what the user can redeem
  function canRedeem() {
    if (!loaded) {
      for (let i = 0; i < cTokens.length; i++) {
        // check if the balance value is defined
        if(balances[cTokens[i]][account] !== undefined ){
          // if defined setup instance
        const instance = {
          cToken: cTokens[i],
          balance: balances[cTokens[i]][account],
          cTokenLabel: cTokensLabels[i]
        }
        // add instance to array
        setRedeemable(redeemable => [...redeemable, instance])
      }}
      // set loaded state as true
      setLoaded(true)
      props.onCompute()
      
    }
  }

  // render the data
  return (
    <div className="rarihackeligilibity">
      <p><button onClick={canRedeem}> Balances </button></p>
      {
      loaded && redeemable.length == 0 ?
        <span>you are not eligible</span>
        :
        loaded && redeemable !==null ? <table className="mb-3">
          <thead>
            <tr>
              <th>cToken</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {redeemable.map((instance, i) => {
              return <Row key={i} cToken={instance.cToken} cTokenLabel={instance.cTokenLabel} balance={instance.balance} />
            })}
          </tbody>
        </table> : null}
    </div>
  );

}

export default RariHackEligibility; 