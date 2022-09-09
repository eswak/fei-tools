import { checkProperties } from 'ethers/lib/utils';
import React, { useEffect, useState } from 'react';
import { ChainDoesNotSupportMulticallError, useAccount } from 'wagmi';
import proofs from '../../data/proofs.json';
import SignAndClaim from './signAndClaimCall';
import MultiRedeemCall from './multiRedeemCall';
import RedeemRow from './row';

export default function SignClaimRedeemCall(props) {
  const [redeemState, setRedeemState] = useState(true);
  const address = useAccount().address;

  ///SMART CONTRACT FUNCTION FOR REFERENCE
  /// @notice Combines sign, claim, and redeem into a single function
  /// @param _signature the user's signature, encoded as a 65-length bytes: bytes.concat(bytes32(r), bytes32(s), bytes1(v));
  /// @param _cTokens the cTokens being claimed
  /// @param _amountsToClaim the amounts of each cToken to claim; should match the merkle proofs
  /// @param _amountsToRedeem the amounts of each cToken to redeem; must be greater than 0 for each cToken provided
  /// @param _merkleProofs the merkle proofs for each claim
  ///////////////////////////////////
  // function signAndClaimAndRedeem(
  //     bytes calldata _signature,
  //     address[] calldata _cTokens,
  //     uint256[] calldata _amountsToClaim,
  //     uint256[] calldata _amountsToRedeem,
  //     bytes32[][] calldata _merkleProofs
  // ) external virtual;
  ///////////////////////////////////

  /// DATA TRANSFORMATION INTO INPUTS
  ////0. signature
  //// signature is in props.signedMessage
  ////1. _cTokens
  const cTokens = props.toRedeem.reduce(function (accu, curr) {
    accu.push(curr.cToken);
    return accu;
  }, []);

  ////2. _amountsToClaim
  const amountsToClaim = props.redeemable.reduce(function (accu, curr) {
    accu.push(curr.balance);
    return accu;
  }, []);

  ////3. _amountsToRedeem
  const amountsToRedeem = props.toRedeem.reduce(function (accu, curr) {
    accu.push(curr.balance);
    return accu;
  }, []);

  ////4. _merkeProofs
  const merkleProofs = cTokens.map((instance, i) => {
    return proofs[instance][address.toLowerCase()];
  });

  // Total of redeemed FEI
  const redeemingTotalFei = cTokens.reduce((acc, cur, i) => {
    acc += (amountsToRedeem[i] * rates[cur]) / 1e18;
    return acc;
  }, 0);

  return (
    <div>
      <div>
        <h3>You are redeeming:</h3>
        <table className="mb-3">
          <thead>
            <tr>
              <th>cToken</th>
              <th className="text-right">Redeeming</th>
            </tr>
          </thead>
          <tbody>
            {cTokens.map((instance, i) => {
              return (
                <tr key={i} className={i % 2 ? 'odd' : 'even'}>
                  <td title={instance}>{props.toRedeem[i].cTokenLabel}</td>
                  <td align="right">{formatNumber((amountsToRedeem[i] * rates[instance]) / 1e18)} FEI</td>
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
        <p>Before clicking make sure you have approved all cToken transfers, else the transaction will fail.</p>
        <p>
          {props.alreadySigned ? (
            <MultiRedeemCall
              contractAddress={props.contractAddress}
              signedMessage={props.signedMessage}
              cTokens={cTokens}
              amountsToClaim={amountsToClaim}
              amountsToRedeem={amountsToRedeem}
              merkleProofs={merkleProofs}
            />
          ) : (
            <SignAndClaim
              contractAddress={props.contractAddress}
              signedMessage={props.signedMessage}
              cTokens={cTokens}
              amountsToClaim={amountsToClaim}
              amountsToRedeem={amountsToRedeem}
              merkleProofs={merkleProofs}
            />
          )}
        </p>
      </div>
    </div>
  );
}

// format a number to XX,XXX,XXX
function formatNumber(n) {
  return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}
