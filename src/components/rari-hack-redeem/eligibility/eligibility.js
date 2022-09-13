import React, { useState, useEffect } from 'react';
import { useAccount, useProvider } from 'wagmi';
import snapshot from '../data/snapshot.json';
import labels from '../data/labels.json';
import rates from '../data/rates.json';
import MultiMerkleRedeemerAbi from '../../../abi/MultiMerkleRedeemer.json';
import { ethers } from 'ethers';
import decimals from  '../data/decimals.json';
import { formatNumber, formatPercent } from '../../../modules/utils';

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
              redeemed: 0,
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
            liftUpValue.forEach(function (liftUpValueItem) {
              if (liftUpValueItem.cToken.toLowerCase() == redeemedEvent.args.cToken.toLowerCase()) {
                liftUpValueItem.balance = liftUpValueItem.balance - redeemedEvent.args.cTokenAmount;
                liftUpValueItem.redeemed = redeemedEvent.args.cTokenAmount;
              }
            });
          }
        });

        // set loaded state as true
        setRedeemable(liftUpValue);
        setLoaded(true);
        props.onCompute(eligibilityCheck, liftUpValue);
      });
    }
  }
  useEffect(() => {
    canRedeem();
  }, [props.redeemed]);

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
              <th className="text-right">Eligible</th>
              <th className="text-right">Already redeemed</th>
              <th className="text-right">Eligible FEI</th>
            </tr>
          </thead>
          <tbody>
            {redeemable.map((instance, i) => {
              return (
                <tr key={i} className={i % 2 ? 'odd' : 'even'}>
                  <td title={instance.cToken}>
                    <a href={'https://etherscan.io/address/' + instance.cToken}>{instance.cTokenLabel}</a>
                  </td>
                  <td className="text-right" title={'Wei: ' + BigInt(instance.eligible).toString()}>
                    {formatNumber(instance.eligible, decimals[instance.cToken.toLowerCase()])}
                  </td>
                  <td
                    className="text-right"
                    title={
                      'Eligible: ' +
                      formatNumber(instance.eligible, decimals[instance.cToken.toLowerCase()]) +
                      '\nRedeemed: -' +
                      formatNumber(instance.redeemed, decimals[instance.cToken.toLowerCase()]) +
                      '\n---------------\nRedeemable FEI: ' +
                      formatNumber(instance.balance) +
                      '\nRedeemable FEI Wei: ' +
                      BigInt(instance.balance).toString()
                    }
                  >
                    {formatPercent(instance.redeemed / instance.eligible)}
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
