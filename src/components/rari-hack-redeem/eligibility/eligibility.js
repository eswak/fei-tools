import { checkProperties } from 'ethers/lib/utils';
import React, { Component, useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import snapshot from '../data/snapshot.json';
import labels from '../data/labels.json';
import rates from '../data/rates.json';

export function RariHackEligibility(props) {
  const account = useAccount().address;
  const [redeemable, setRedeemable] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // temporary fix for rates, make sure every keys are lowercase
  for (var key in rates) {
    rates[key.toLocaleLowerCase()] = rates[key];
  }

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
              rate: rates[cTokenAddress],
              fei: (userRedeemableBalance * rates[cTokenAddress]) / 1e18,
              cTokenLabel: labels[cTokenAddress],
              approved: false
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
    canRedeem();
  }, []);

  // render the data
  return (
    <div className="rarihackeligilibity">
      {!loaded ? <div>Checking Eligibility...</div> : null}
      {loaded && !redeemable.length ? (
        <div>
          <p>
            Your address is not eligible for the Fuse Hack Payment. <br />
            Please check the table below to see if one of your other addresses are eligible.
          </p>
        </div>
      ) : null}
      {loaded && redeemable.length ? (
        <table className="mb-3">
          <thead>
            <tr>
              <th>cToken</th>
              <th className="text-right">cToken balance</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Redeemable</th>
            </tr>
          </thead>
          <tbody>
            {redeemable.map((instance, i) => {
              return (
                <tr key={i} className={i % 2 ? 'odd' : 'even'}>
                  <td title={instance.cToken}>
                    <a href={'https://etherscan.io/address/' + instance.cToken}>{instance.cTokenLabel}</a>
                  </td>
                  <td className="text-right" title={'Wei: ' + instance.balance}>
                    <a href={'https://etherscan.io/token/' + instance.cToken + '?a=' + account}>
                      {formatNumber(instance.balance)}
                    </a>
                  </td>
                  <td className="text-right" title={'Wei: ' + instance.rate}>
                    {formatRate(instance.rate)}
                  </td>
                  <td className="text-right">{formatNumber(instance.fei)} FEI</td>
                </tr>
              );
            })}
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td className="text-right">
                <span style={{ borderTop: '1px solid' }}>
                  <strong>Total: </strong>
                  {formatNumber(
                    redeemable.reduce((sum, instance, i) => {
                      sum += instance.fei;
                      return sum;
                    }, 0)
                  )}{' '}
                  FEI
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

export default RariHackEligibility;

// format a number to XX,XXX,XXX
function formatNumber(n) {
  return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}

// format a rate with 6 decimals
function formatRate(n) {
  var ret = Math.floor(n / 1e12) / 1e6;
  ret = ret.toString();
  while (ret.length < 8) ret = ret + '0';
  if (ret > 2) ret = Math.floor(ret * 1000) / 1000;
  if (ret > 10) ret = Math.floor(ret * 100) / 100;
  if (ret > 100) ret = Math.floor(ret * 10) / 10;
  if (ret > 1000) ret = Math.floor(ret);
  return ret;
}
