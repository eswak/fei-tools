import React, { useState, useEffect } from 'react';
import ClaimRow from './claimRow';
import SignClaimRedeemCall from './signClaimRedeemFunction/signClaimRedeemCall';

export function ClaimAndRedeem(props) {
  const [redeemable, setRedeemable] = useState(props.redeemableTokens);
  const [wantRedeem, setWantRedeem] = useState(props.redeemableTokens);

  // function to handle value change in the form
  function updateWantRedeem(cToken, value) {
    setWantRedeem((previousArray) => {
      return previousArray.map((item, i) => {
        return item.cToken === cToken ? { ...item, balance: value } : item;
      });
    });
  }

  function approve(cToken) {
    setWantRedeem((previousArray) => {
      return previousArray.map((item, i) => {
        return item.cToken === cToken ? { ...item, approved: true } : item;
      });
    });
  }

  return (
    <div>
      <p>How many tokens do you want to redeem?</p>
      <table className="mb-3" style={{ maxWidth: '800px' }}>
        <thead>
          <tr>
            <th>cToken</th>
            <th className="text-center">Balance</th>
            <th>Redeeming</th>
            <th>Presets</th>
          </tr>
        </thead>
        <tbody>
          {props.redeemableTokens.map((instance, i) => {
            return (
              <ClaimRow
                updateNumber={updateWantRedeem}
                approve={approve}
                rowkey={i}
                key={i}
                cToken={instance.cToken}
                cTokenLabel={instance.cTokenLabel}
                balance={instance.balance}
              />
            );
          })}
        </tbody>
      </table>
      <SignClaimRedeemCall
        alreadySigned={props.alreadySigned}
        signedMessage={props.signedMessage}
        contractAddress={props.contractAddress}
        toRedeem={wantRedeem}
        redeemable={redeemable}
      />
    </div>
  );
}
