import React, { useState } from 'react';
import { useProvider, useAccount, useSigner } from 'wagmi';
import { ethers } from 'ethers';
import IERC20 from '../../../abi/IERC20.json';
import MultiMerkleRedeemer from '../../../abi/MultiMerkleRedeemer.json';
import EventEmitter from '../../../modules/event-emitter';
import { formatNumber } from '../../../modules/utils';
import decimals from '../data/decimals.json';
import rates from '../data/rates.json';
import labels from '../data/labels.json';
import feiImg from '../../collateralization/img/fei.png';

export function Redeem(props) {
  const account = useAccount().address;
  const provider = useProvider();
  const signer = useSigner().data;

  const fei = new ethers.Contract('0x956F47F50A910163D8BF957Cf5846D573E7f87CA', IERC20, provider);
  const redeemer = new ethers.Contract(props.contractAddress, MultiMerkleRedeemer, signer);

  const [updated, setUpdated] = useState(Date.now());
  const [contractFeiBalance, setContractFeiBalance] = useState(null);
  const [userFeiBalance, setUserFeiBalance] = useState(null);
  const [balances, setBalances] = useState({}); // { cTokenAddress: 'balance' }
  const [allowances, setAllowances] = useState({}); // { cTokenAddress: 'allowance' }
  const [inputValues, setInputValues] = useState(
    props.redeemableTokens.reduce((acc, cur) => {
      acc[cur.cToken] = '0';
      return acc;
    }, {})
  ); // { cTokenAddress: 'amount' }

  const eligible = props.redeemableTokens.reduce((acc, token) => {
    acc[token.cToken] = token.balance;
    return acc;
  }, {});

  // fetch current cToken balances and approvals etc once on load
  if (Object.keys(balances).length == 0) {
    const promises = [];
    // fetch ctoken balances
    promises.push(
      Promise.all(
        props.redeemableTokens.map((token) => {
          const cToken = new ethers.Contract(token.cToken, IERC20, provider);
          return cToken.balanceOf(account);
        })
      )
    );
    // fetch ctoken allowances
    promises.push(
      Promise.all(
        props.redeemableTokens.map((token) => {
          const cToken = new ethers.Contract(token.cToken, IERC20, provider);
          return cToken.allowance(account, props.contractAddress);
        })
      )
    );
    // fetch user FEI balance
    promises.push(fei.balanceOf(account));
    // fetch contract FEI balance
    promises.push(fei.balanceOf(props.contractAddress));

    Promise.all(promises).then(function ([_balances, _allowances, _userFei, _contractFei]) {
      props.redeemableTokens.forEach(function (token, i) {
        balances[token.cToken] = _balances[i].toString();
        allowances[token.cToken] = _allowances[i].toString();
        inputValues[token.cToken] = Math.floor(
          _balances[i].toString() / Math.pow(10, decimals[token.cToken])
        ).toString();
      });
      setBalances(balances);
      setAllowances(allowances);
      setInputValues(inputValues);
      setUserFeiBalance(_userFei.toString());
      setContractFeiBalance(_contractFei.toString());
      setUpdated(Date.now());
    });
  }

  function handleTextInputChange(cTokenAddress, newValue) {
    const newValueWithDecimals = getInputWithDecimals(cTokenAddress, newValue);
    if (BigInt(newValueWithDecimals) > BigInt(eligible[cTokenAddress])) {
      newValue = formatNumber(eligible[cTokenAddress], decimals[cTokenAddress]).replace(/,/g, '');
    }
    //if (getInputWithDecimals(cTokenAddress, newValue) > eligible[cTokenAddress]) newValue = eligible[cTokenAddress];
    const newInputValues = JSON.parse(JSON.stringify(inputValues));
    newInputValues[cTokenAddress] = newValue || '';
    setInputValues(newInputValues);
  }

  function getPercentInputValue(cTokenAddress, percent) {
    const currentBalance = formatNumber(balances[cTokenAddress], decimals[cTokenAddress]).replace(/,/g, '');
    let newValue = Math.floor((currentBalance * percent) / 100).toString();
    return newValue;
  }

  function setPercent(cTokenAddress, percent) {
    const newInputValues = JSON.parse(JSON.stringify(inputValues));
    const newValue = getPercentInputValue(cTokenAddress, percent);
    newInputValues[cTokenAddress] = newValue || '';
    setInputValues(newInputValues);
  }

  function getInputWithDecimals(cTokenAddress, value) {
    const inputValue = value !== undefined ? value : inputValues[cTokenAddress] || '0';
    const currentBalance = formatNumber(balances[cTokenAddress], decimals[cTokenAddress]).replace(/,/g, '');
    if (inputValue == currentBalance) return balances[cTokenAddress]; // full precision for 100%
    return BigInt(inputValue * Math.pow(10, decimals[cTokenAddress])).toString();
  }

  // Reformattings for display
  const redeemedFei = Object.keys(inputValues || {}).map((cTokenAddress) => {
    return BigInt(
      Math.floor((inputValues[cTokenAddress] * Math.pow(10, decimals[cTokenAddress]) * rates[cTokenAddress]) / 1e18)
    ).toString();
  });
  const totalRedeemedFei = redeemedFei.reduce((sum, n) => {
    return (BigInt(sum) + BigInt(n)).toString();
  }, '0');
  const approved = props.redeemableTokens.map((token) => {
    return BigInt(allowances[token.cToken] || '0') >= BigInt(getInputWithDecimals(token.cToken) || '0');
  });
  const allApproved = approved.reduce((allApproved, tokenApproved) => {
    return allApproved && tokenApproved;
  }, true);
  const balanceAbove = props.redeemableTokens.map((token) => {
    return BigInt(balances[token.cToken] || '0') >= BigInt(getInputWithDecimals(token.cToken) || '0');
  });
  const allBalanceAbove = balanceAbove.reduce((allApproved, tokenApproved) => {
    return allApproved && tokenApproved;
  }, true);
  const cTokensToRedeem = props.redeemableTokens.reduce((array, token, i) => {
    if (inputValues[token.cToken] != '0') array.push(token.cToken);
    return array;
  }, []);
  const amountsToRedeem = props.redeemableTokens.reduce((array, token, i) => {
    if (inputValues[token.cToken] != '0') array.push(getInputWithDecimals(token.cToken));
    return array;
  }, []);

  async function doApprove(cTokenAddress) {
    const cToken = new ethers.Contract(cTokenAddress, IERC20, signer);
    const amount = getInputWithDecimals(cTokenAddress, eligible[cTokenAddress]);
    cToken.approve(props.contractAddress, amount).then(function (tx) {
      // If broadcasting a new TX, display the toast
      EventEmitter.dispatch('tx', {
        hash: tx.hash,
        label:
          'Approve ' +
          formatNumber(amount, decimals[cTokenAddress]) +
          ' ' +
          labels[cTokenAddress] +
          ' on Redeemer contract.',
        // when the tx is mined, update allowances
        cb: function () {
          allowances[cTokenAddress] = amount;
          setAllowances(allowances);
          setUpdated(Date.now());
        }
      });
    });
  }

  async function doRedeem() {
    redeemer.multiRedeem(cTokensToRedeem, amountsToRedeem).then(function (tx) {
      // If broadcasting a new TX, display the toast
      EventEmitter.dispatch('tx', {
        hash: tx.hash,
        label: 'Redeeming ' + formatNumber(totalRedeemedFei) + ' FEI.',
        // when the tx is mined, refresh the page
        cb: async function () {
          document.location.reload();
        }
      });
    });
  }

  return (
    <div>
      <p>How many tokens do you want to redeem?</p>
      <table className="mb-3">
        <thead>
          <tr>
            <th>cToken</th>
            <th className="text-right">Redeemable Balance</th>
            <th className="text-right">Current Balance</th>
            <th className="text-right" style={{ paddingRight: '5px' }}>
              Redeeming
            </th>
            <th width="0"></th>
            <th className="text-center">Approve</th>
          </tr>
        </thead>
        <tbody>
          {props.redeemableTokens.map((token, i) => (
            <tr key={i} className={i % 2 ? 'odd' : 'even'}>
              <td title={token.cToken}>{token.cTokenLabel}</td>
              <td className="text-right">{formatNumber(token.balance, decimals[token.cToken.toLowerCase()])}</td>
              <td
                className="text-right"
                style={{
                  color: balanceAbove[i] ? '#388E3C' : '#D32F2F'
                }}
              >
                {!balanceAbove[i] ? '⚠️ ' : ' '}
                {formatNumber(balances[token.cToken] || '0', decimals[token.cToken.toLowerCase()])}
              </td>
              <td className="text-right" style={{ paddingRight: '5px' }}>
                <div style={{ position: 'relative' }}>
                  <div className="percents-box">
                    {[0, 33, 66, 100].map((percent, i) => {
                      return (
                        <div key={i} className="percent" onClick={() => setPercent(token.cToken, percent)}>
                          {percent == 100 ? '%' : percent}
                        </div>
                      );
                    })}
                  </div>
                  <input
                    style={{ textAlign: 'right', height: '30px' }}
                    type="number"
                    placeholder="0"
                    value={inputValues[token.cToken] || ''}
                    onChange={(e) => handleTextInputChange(token.cToken, e.target.value)}
                  />
                </div>
              </td>
              <td className="text-left text-muted" style={{ paddingLeft: '0' }} width="0">
                = {formatNumber(redeemedFei[i])} FEI
              </td>
              <td className="text-center">
                <button
                  disabled={approved[i]}
                  onClick={() => doApprove(token.cToken)}
                  title={'Current allowance ' + allowances[token.cToken]}
                >
                  Approve
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td className="text-right" style={{ paddingRight: '5px' }}>
              <strong>Total</strong>
            </td>
            <td style={{ paddingLeft: '0' }}>= {formatNumber(totalRedeemedFei)} FEI</td>
          </tr>
        </tbody>
      </table>

      {!allApproved ? (
        <div className="error mt-2">You must approve all cTokens before redeeming this amount.</div>
      ) : null}
      {!allBalanceAbove ? (
        <div className="error mt-2">You must transfer more cTokens to your address before redeeming this amount.</div>
      ) : null}
      {totalRedeemedFei == '0' ? <div className="error mt-2">You cannot redeem 0 FEI.</div> : null}

      <div className="mt-2">
        <button disabled={totalRedeemedFei == '0' || !allBalanceAbove || !allApproved} onClick={() => doRedeem()}>
          Redeem {formatNumber(totalRedeemedFei)} FEI in exchange of{' '}
          {amountsToRedeem
            .map((amountToRedeem, i) => {
              const cTokenAddress = cTokensToRedeem[i];
              return '[' + formatNumber(amountToRedeem, decimals[cTokenAddress]) + ' ' + labels[cTokenAddress] + ']';
            })
            .join(' + ')}
        </button>
      </div>
      <div className="mt-2">
        Your Balance: <img src={feiImg} style={{ height: '1em', verticalAlign: '-2px' }} />{' '}
        {formatNumber(userFeiBalance)} FEI
      </div>
      <div className="mt-2">
        Redeemer Balance: <img src={feiImg} style={{ height: '1em', verticalAlign: '-2px' }} />{' '}
        {formatNumber(contractFeiBalance)} FEI
      </div>
    </div>
  );
}
