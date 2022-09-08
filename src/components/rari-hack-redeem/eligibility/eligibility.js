import { checkProperties } from 'ethers/lib/utils';
import React, { Component, useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import snapshot from '../data/snapshot.json';
import labels from '../data/labels.json';
import rates from '../data/rates.json';
import Row from './row';

export function RariHackEligibility(props) {
  const account = useAccount().address;
  const [redeemable, setRedeemable] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // finding out what the user can redeem
  function canRedeem() {
    let eligibilityCheck = false;
    let liftUpValue = [];
    if (!loaded) {
      for (var cTokenAddress in snapshot) {
        for (var userAddress in snapshot[cTokenAddress]) {
          if (userAddress.toLowerCase() == account.toLowerCase()) {
            const userRedeemableBalance = snapshot[cTokenAddress][userAddress];
            const instance = {
              cToken: cTokenAddress,
              balance: userRedeemableBalance,
              cTokenLabel: labels[cTokenAddress],
              approved: false,
            };
            // add instance to array
            liftUpValue.push(instance);
            eligibilityCheck = true;
          }
        }
      }
      // set loaded state as true
      setRedeemable(liftUpValue);
      setLoaded(true);
      props.onCompute(eligibilityCheck, liftUpValue);
    }
  }
  useEffect(() => {
    canRedeem()
  }, []);


  // render the data
  return (
    <div className="rarihackeligilibity">
      { !loaded ? <div>Checking Eligibility...</div> : null }
      { loaded && !redeemable.length ? <div>
        <p>
          Your address is not eligible for the Fuse Hack Payment. <br/>
          Please check the table below to see if one of your other addresses are eligible.
        </p>
      </div> : null }
      { loaded && redeemable.length ? <table className="mb-3">
        <thead>
          <tr>
            <th>cToken</th>
            <th className="text-center">Balance</th>
          </tr>
        </thead>
        <tbody>
          {redeemable.map((instance, i) => {
            return <Row key={i} rowkey={i} cToken={instance.cToken} cTokenLabel={instance.cTokenLabel} balance={instance.balance} />
          })}
        </tbody>
      </table> : null}
    </div>
  );

}

export default RariHackEligibility; 