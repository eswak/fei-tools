import { checkProperties } from 'ethers/lib/utils';
import React, { Component, useState, useEffect } from 'react';
import { useAccount, useContractRead, useProvider } from 'wagmi';
import snapshot from '../data/snapshot.json';
import labels from '../data/labels.json';
import rates from '../data/rates.json';
import MultiMerkleRedeemerAbi from '../../../abi/MultiMerkleRedeemer.json';
import { ethers } from 'ethers';

export function RariHackEligibility(props) {
  const account = useAccount().address;
  const [redeemable, setRedeemable] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const provider = useProvider();
  const redeemer = new ethers.Contract(props.contractAddress, MultiMerkleRedeemerAbi, provider);
    // fetch event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);
    async function getRedeemedEvents() {
      return await redeemer.queryFilter(redeemer.filters.Redeemed());
    }

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
              eligible: userRedeemableBalance,
              balance: userRedeemableBalance,
              redeemed: null,
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


          /// UPDATING INFO FROM THE JSON WITH PAST REDEEM EVENTS
    Promise.all([getRedeemedEvents()]).then(function (data) {
      const [redeemedEvents] = data;
    // for each Redeemed events, diminish the cToken amount available to the user
    // event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);
    redeemedEvents.forEach(function (redeemedEvent) {
      if (redeemedEvent.args.recipient == account) {
        liftUpValue.map((item, i) => {
          return item.cToken === redeemedEvent.args.cToken ? { ...item, balance: item.balance - redeemedEvent.args.cTokenAmount, redeemed: redeemedEvent.args.cTokenAmount} : item 
      } );
      }
    }
    );
      // set loaded state as true
      setRedeemable(liftUpValue);
      setLoaded(true);
      props.onCompute(eligibilityCheck, liftUpValue);
    })
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
