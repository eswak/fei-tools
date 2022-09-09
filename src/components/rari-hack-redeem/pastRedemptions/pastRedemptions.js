import React, { useState } from 'react';
import { useProvider } from 'wagmi';
import { ethers } from 'ethers';
import MultiMerkleRedeemerAbi from '../../../abi/MultiMerkleRedeemer.json';
import rates from '../data/rates.json';
import snapshot from '../data/snapshot.json';

export function PastRedemptions(props) {
  const provider = useProvider();
  const redeemer = new ethers.Contract(props.contractAddress, MultiMerkleRedeemerAbi, provider);

  const [userData, setUserData] = useState([]);
  const [totalClaimable, setTotalClaimable] = useState('0');
  const [totalClaimed, setTotalClaimed] = useState('0');

  if (!userData.length) {
    Promise.all([
      // ask the 3 event types in parallel
      getSignedEvents(),
      getClaimedEvents(),
      getRedeemedEvents()
    ]).then(function (data) {
      const [signedEvents, claimedEvents, redeemedEvents] = data;
      // initialize user data with snapshot claimable amounts
      const userData = {};
      for (var ctokenAddress in snapshot) {
        for (var userAddress in snapshot[ctokenAddress]) {
          userData[userAddress] = userData[userAddress] || {
            address: userAddress,
            claimable: 0,
            signed: false,
            claimed: 0,
            redeemed: 0
          };
          userData[userAddress].claimable += (rates[ctokenAddress] / 1e18) * snapshot[ctokenAddress][userAddress];
        }
      }
      // for each Signed events, set signed = true in userData
      // event Signed(address indexed signer, bytes signature);
      signedEvents.forEach(function (signedEvent) {
        userData[signedEvent.args.signer.toLowerCase()].signed = true;
      });
      // for each Claimed events, increment the amount claimed
      // event Claimed(address indexed claimant, address indexed cToken, uint256 claimAmount);
      claimedEvents.forEach(function (claimedEvent) {
        userData[claimedEvent.args.claimant.toLowerCase()].claimed +=
          (rates[claimedEvent.args.cToken.toLowerCase()] / 1e18) * claimedEvent.args.claimAmount;
      });
      // for each Redeemed events, increment the amount redeemed
      // event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);
      redeemedEvents.forEach(function (redeemedEvent) {
        userData[redeemedEvent.args.recipient.toLowerCase()].redeemed +=
          (rates[redeemedEvent.args.cToken.toLowerCase()] / 1e18) * redeemedEvent.args.cTokenAmount;
      });

      // array of user data sorted by claimable DESC
      setUserData(
        Object.values(userData).sort(function (a, b) {
          return a.claimable < b.claimable ? 1 : -1;
        })
      );
      // sum of all claimed
      setTotalClaimed(
        Object.values(userData).reduce(function (acc, cur) {
          acc += cur.claimed;
          return acc;
        }, 0)
      );
      // sum of all claimable
      setTotalClaimable(
        Object.values(userData).reduce(function (acc, cur) {
          acc += cur.claimable;
          return acc;
        }, 0)
      );
    });
  }

  // If data is loading, display a loading state
  if (userData.length == 0) {
    return <div className="text-center">Loading...</div>;
  }

  // If data is loaded, display the full data table
  return (
    <div>
      <p>
        Amount of FEI available for redemptions: {formatNumber(totalClaimable)} <br />
        Amount of FEI claimed: {formatNumber(totalClaimed)} ({formatPercent(totalClaimed / totalClaimable)}) <br />
        Amount of FEI left to claim {formatNumber(totalClaimable - totalClaimed)} (
        {formatPercent((totalClaimable - totalClaimed) / totalClaimable)})
      </p>
      <table className="mb-3" style={{ maxWidth: '900px' }}>
        <thead>
          <tr>
            <th>User</th>
            <th className="text-right">Claimable&nbsp;FEI</th>
            <th className="text-center">Signed</th>
            <th className="text-center">Claimed</th>
            <th className="text-center">Redeemed</th>
          </tr>
        </thead>
        <tbody>
          {userData.map((d, i) => (
            <tr key={i} className={i % 2 ? 'odd' : 'even'}>
              <td style={{ fontFamily: 'monospace' }}>
                <a href={'https://etherscan.io/address/' + d.address}>{d.address}</a>
              </td>
              <td className="text-right">{formatNumber(d.claimable)}</td>
              <td className="text-center">{d.signed ? '✅' : '❌'}</td>
              <td className="text-center">{formatPercent(d.claimed / d.claimable)}</td>
              <td className="text-center">{formatPercent(d.redeemed / d.claimable)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // format a number to XX,XXX,XXX
  function formatNumber(n) {
    return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
  }

  // format a [0, 1] number to a %
  function formatPercent(n) {
    return Math.floor(n * 100) + '%';
  }

  // fetch event Signed(address indexed signer, bytes signature);
  async function getSignedEvents() {
    return await redeemer.queryFilter(redeemer.filters.Signed());
  }

  // fetch event Claimed(address indexed claimant, address indexed cToken, uint256 claimAmount);
  async function getClaimedEvents() {
    return await redeemer.queryFilter(redeemer.filters.Claimed());
  }

  // fetch event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);
  async function getRedeemedEvents() {
    return await redeemer.queryFilter(redeemer.filters.Redeemed());
  }
}
