import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import MultiRedeemCall from './multiRedeemCall';
import rates from '../../data/rates.json';
import ApproveCToken from '../approvecToken';
import { formatNumber } from '../../../../modules/utils';

export default function SignClaimRedeemCall(props) {
  const [toRedeem, setToRedeem] = useState(props.toRedeem);
  // Array of approve status, e.g. [false, true, false]
  const [approveStatus, setApproveStatus] = useState(
    props.toRedeem.reduce(function (acc, cur) {
      acc.push(false);
      return acc;
    }, [])
  );
  // Total FEI to redeem
  const redeemingTotalFei = props.toRedeem.reduce(function (sum, cur, i) {
    sum += (cur.balance * rates[cur.cToken]) / 1e18;
    return sum;
  }, 0);

  /// When a token is approved, approveInfo = { cTokenAddress: string, approved: bool }
  function handleCTokenApproved(approveInfo) {
    setApproveStatus((previousArray) => {
      return previousArray.map((approved, i) => {
        return props.toRedeem[i].cToken === approveInfo.cTokenAddress ? approveInfo.approved : approved;
      });
    });
  }

  // false if any of the ctokens are not approved
  const allApproved = approveStatus.reduce(function (allApproved, cTokenApproved) {
    return allApproved && cTokenApproved;
  }, true);

  useEffect(() => {
    setToRedeem(props.toRedeem);
  }, [props.toRedeem]);

  return (
    <div>
      <div>
        <h3>You are redeeming:</h3>
        <table className="mb-3">
          <thead>
            <tr>
              <th>cToken</th>
              <th className="text-right">Redeeming</th>
              <th className="text-center">Approve</th>
            </tr>
          </thead>
          <tbody>
            {toRedeem.map((toRedeem, i) => {
              return (
                <tr key={i} className={i % 2 ? 'odd' : 'even'}>
                  <td title={toRedeem.cToken}>{toRedeem.cTokenLabel}</td>
                  <td className="text-right">{formatNumber((toRedeem.balance * rates[toRedeem.cToken]) / 1e18)} FEI</td>
                  <td className="text-center">
                    <ApproveCToken
                      liftState={handleCTokenApproved}
                      approved={approveStatus[i]}
                      value={toRedeem.balance}
                      eligible={toRedeem.eligible}
                      cTokenAddress={toRedeem.cToken}
                      contractAddress={props.contractAddress}
                    />
                  </td>
                </tr>
              );
            })}
            <tr>
              <td></td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ borderTop: '1px solid' }}>
                  <strong>Total:</strong>
                  &nbsp;
                  {formatNumber(redeemingTotalFei)} FEI
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <MultiRedeemCall
          contractAddress={props.contractAddress}
          cTokens={_.map(toRedeem, 'cToken')}
          amountsToRedeem={_.map(toRedeem, 'balance')}
          allApproved={allApproved}
          redeemingTotalFei={redeemingTotalFei}
          handleRedeemed={props.handleRedeemed}
        />
      </div>
    </div>
  );
}
