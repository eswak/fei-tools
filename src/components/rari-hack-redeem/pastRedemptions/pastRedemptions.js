import React, { useEffect, useState } from 'react';
import { useProvider } from 'wagmi';
import { ethers } from 'ethers';
import MultiMerkleRedeemerAbi from '../../../abi/MultiMerkleRedeemer.json';
import rates from '../data/rates.json';
import snapshot from '../data/snapshot.json';
import labels from '../data/labels.json';
import decimals from '../data/decimals.json';
import comptrollers from '../data/comptrollers.json';
import { formatNumber, formatPercent } from '../../../modules/utils';

export function PastRedemptions(props) {
  const provider = useProvider();
  const redeemer = new ethers.Contract(props.contractAddress, MultiMerkleRedeemerAbi, provider);

  const [userData, setUserData] = useState([]);
  const [poolData, setPoolData] = useState({});
  const [totalClaimable, setTotalClaimable] = useState('0');
  const [totalClaimed, setTotalClaimed] = useState('0');
  const [totalRedeemed, setTotalRedeemed] = useState('0');
  const [reload, setReload] = useState(false);

  useEffect(() => {
    setReload(!reload);
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
        const poolData = {};
        for (var ctokenAddress in snapshot) {
          const comptrollerAddress = comptrollers[ctokenAddress];
          const poolLabel = labels[comptrollerAddress];
          poolData[comptrollerAddress] = poolData[comptrollerAddress] || {
            label: poolLabel,
            cTokens: {},
            claimable: 0,
            claimed: 0,
            redeemed: 0
          };
          poolData[comptrollerAddress].cTokens[ctokenAddress] = poolData[comptrollerAddress].cTokens[ctokenAddress] || {
            label: labels[ctokenAddress],
            claimable: 0,
            claimed: 0,
            redeemed: 0
          };

          for (var userAddress in snapshot[ctokenAddress]) {
            userData[userAddress] = userData[userAddress] || {
              address: userAddress,
              claimableLabels: [],
              claimable: 0,
              signed: false,
              claimed: 0,
              redeemed: 0
            };
            userData[userAddress].claimable += (rates[ctokenAddress] / 1e18) * snapshot[ctokenAddress][userAddress];
            userData[userAddress].claimableLabels.push(
              formatNumber(snapshot[ctokenAddress][userAddress], decimals[ctokenAddress]) +
                ' ' +
                labels[ctokenAddress] +
                ' -> ' +
                formatNumber((rates[ctokenAddress] / 1e18) * snapshot[ctokenAddress][userAddress]) +
                ' FEI'
            );

            poolData[comptrollerAddress].claimable +=
              (rates[ctokenAddress] / 1e18) * snapshot[ctokenAddress][userAddress];
            poolData[comptrollerAddress].cTokens[ctokenAddress].claimable +=
              (rates[ctokenAddress] / 1e18) * snapshot[ctokenAddress][userAddress];
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
          const amount = (rates[claimedEvent.args.cToken.toLowerCase()] / 1e18) * claimedEvent.args.claimAmount;
          userData[claimedEvent.args.claimant.toLowerCase()].claimed += amount;

          const comptrollerAddress = comptrollers[claimedEvent.args.cToken.toLowerCase()];
          poolData[comptrollerAddress].claimed += amount;
          poolData[comptrollerAddress].cTokens[claimedEvent.args.cToken.toLowerCase()].claimed += amount;
        });
        // for each Redeemed events, increment the amount redeemed
        // event Redeemed(address indexed recipient, address indexed cToken, uint256 cTokenAmount, uint256 baseTokenAmount);
        redeemedEvents.forEach(function (redeemedEvent) {
          const amount = (rates[redeemedEvent.args.cToken.toLowerCase()] / 1e18) * redeemedEvent.args.cTokenAmount;
          userData[redeemedEvent.args.recipient.toLowerCase()].redeemed += amount;

          const comptrollerAddress = comptrollers[redeemedEvent.args.cToken.toLowerCase()];
          poolData[comptrollerAddress].redeemed += amount;
          poolData[comptrollerAddress].cTokens[redeemedEvent.args.cToken.toLowerCase()].redeemed += amount;
        });

        setPoolData(poolData);

        // array of user data sorted by claimable DESC
        setUserData(
          Object.values(userData).sort(function (a, b) {
            return a.claimable < b.claimable ? 1 : -1;
          })
        );
        // sum of all claimed
        setTotalClaimed(
          Object.values(userData).reduce(function (acc, cur) {
            acc += Number(cur.claimed);
            return acc;
          }, 0)
        );
        // sum of all redeemed
        setTotalRedeemed(
          Object.values(userData).reduce(function (acc, cur) {
            acc += Number(cur.redeemed);
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
  }, [props]);

  // If data is loading, display a loading state
  if (userData.length == 0) {
    return <div className="text-center">Loading...</div>;
  }

  // If data is loaded, display the full data table
  return (
    <div>
      <table className="poolStats mb-3">
        <thead>
          <tr>
            <th>Pool / Token</th>
            <th>Claimable FEI</th>
            <th>Claimed FEI</th>
            <th>Redeemed FEI</th>
          </tr>
        </thead>
        <tbody>
          <tr className="poolTotal" style={{ fontWeight: 'bold' }}>
            <td>Total for all pools</td>
            <td>{formatNumber(totalClaimable)}</td>
            <td>
              {formatNumber(totalClaimed)}
              &nbsp;({formatPercent(totalClaimed / totalClaimable)})
            </td>
            <td>
              {formatNumber(totalRedeemed)}
              &nbsp;({formatPercent(totalRedeemed / totalClaimable)})
            </td>
          </tr>
          {Object.keys(poolData).map((comptrollerAddress) => [
            <tr key={comptrollerAddress} className="poolTotal">
              <td>Total for {poolData[comptrollerAddress].label}</td>
              <td>
                {formatNumber(poolData[comptrollerAddress].claimable)}
                &nbsp;({formatPercent(poolData[comptrollerAddress].claimable / totalClaimable)})
              </td>
              <td>
                {formatNumber(poolData[comptrollerAddress].claimed)}
                &nbsp;({formatPercent(poolData[comptrollerAddress].claimed / poolData[comptrollerAddress].claimable)})
              </td>
              <td>
                {formatNumber(poolData[comptrollerAddress].redeemed)}
                &nbsp;({formatPercent(poolData[comptrollerAddress].redeemed / poolData[comptrollerAddress].claimable)})
              </td>
            </tr>,
            Object.keys(poolData[comptrollerAddress].cTokens).map((cTokenAddress, i) => (
              <tr key={cTokenAddress} className={'cToken ' + (i % 2 ? 'odd' : 'even')}>
                <td>{labels[cTokenAddress]}</td>
                <td>{formatNumber(poolData[comptrollerAddress].cTokens[cTokenAddress].claimable)}</td>
                <td>{formatNumber(poolData[comptrollerAddress].cTokens[cTokenAddress].claimed)}</td>
                <td>{formatNumber(poolData[comptrollerAddress].cTokens[cTokenAddress].redeemed)}</td>
              </tr>
            ))
          ])}
        </tbody>
      </table>

      <table className="mb-3">
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
              <td className="text-right" title={d.claimableLabels.join('\n')}>
                {formatNumber(d.claimable)}
              </td>
              <td className="text-center">{d.signed ? '✅' : '❌'}</td>
              <td className="text-center">{formatPercent(d.claimed / d.claimable)}</td>
              <td className="text-center">{formatPercent(d.redeemed / d.claimable)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
