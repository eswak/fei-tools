import React, { useState, useEffect } from 'react';
import ClaimRow from './claimRow';
import SignClaimRedeemCall from './signClaimRedeemFunction/signClaimRedeemCall';

export function ClaimAndRedeem(props) {
  const [redeemable, setRedeemable] = useState(props.redeemableTokens);
  const [wantRedeem, setWantRedeem] = useState(props.redeemableTokens);
  const [reload, setReload] = useState(false);

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
  useEffect(() => {
    setRedeemable(props.redeemableTokens);
    setWantRedeem(props.redeemableTokens);
    setReload(!reload);
  }, [props.redeemableTokens]);

  return (
    <div>
      <p>How many tokens do you want to redeem?</p>
      <table className="mb-3">
        <thead>
          <tr>
            <th>cToken</th>
            <th className="text-right">Balance</th>
            <th className="text-right">Redeeming</th>
            <th className="text-center">Presets</th>
          </tr>
        </thead>
        <tbody>
          {redeemable.map((instance, i) => {
            return (
              <ClaimRow
                updateNumber={updateWantRedeem}
                approve={approve}
                rowkey={i}
                key={i}
                cToken={instance.cToken}
                cTokenLabel={instance.cTokenLabel}
                balance={instance.balance}
                reload={reload}
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
        handleRedeemed={props.handleRedeemed}
      />
    </div>
  );
}
