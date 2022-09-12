import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useProvider } from 'wagmi';
import Comptroller from '../../../abi/Comptroller.json';
import CErc20Delegate from '../../../abi/CErc20Delegate.json';
import labels from '../data/labels.json';
import comptrollers from '../data/comptrollers.json';

export function CheckOpenBorrows(props) {
  const [fuseState, setFuseState] = useState(null);

  const account = useAccount().address;
  const provider = useProvider();

  // Once, fetch Fuse state for the user
  (async (oldFuseState, setFuseState) => {
    if (oldFuseState !== null) return;
    const fuseState = {};
    for (var i in props.redeemableTokens) {
      const info = props.redeemableTokens[i];
      const comptrollerAddress = comptrollers[info.cToken.toLowerCase()];
      const comptroller = new ethers.Contract(comptrollerAddress, Comptroller, provider);
      if (fuseState[info.cToken]) continue;

      const assetsIn = await comptroller.getAssetsIn(account);
      if (assetsIn.length) {
        fuseState[info.cToken] = {};
        for (var j in assetsIn) {
          const cTokenAddress = assetsIn[j];
          const cToken = new ethers.Contract(cTokenAddress, CErc20Delegate, provider);
          const snapshot = await cToken.getAccountSnapshot(account);
          // snapshot = [possible error, token balance, borrow balance, exchange rate mantissa]
          if (snapshot[2].toString() != '0') fuseState[info.cToken][cTokenAddress] = snapshot[2].toString();
          fuseState[info.cToken][cTokenAddress] = '12345';
        }
        if (Object.keys(fuseState[info.cToken]).length == 0) {
          delete fuseState[info.cToken];
        }
      }
    }
    setFuseState(fuseState);
  })(fuseState, setFuseState);

  return (
    fuseState && Object.keys(fuseState).length ? (
      <div>
        <h2>Step 2b: Close open loans</h2>
        <div className="fuse-openborrows">
          <div>
            ⚠️ Please visit the <a href="https://app.rari.capital/fuse">Fuse webapp</a> to close all outstanding Borrow
            Balance.
          </div>
          {Object.keys(fuseState).map((cTokenAddress, i) => (
            <div key={i}>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- You have an open debt that prevents you from redeeming all your [
              {labels[cTokenAddress.toLowerCase()]}]
            </div>
          ))}
          <div>
            To redeem your FEI, you will need to transfer your cTokens (your collateral with bad debt), and this will fail if you have open borrows.
          </div>
        </div>
      </div>
    ) : null
  );
}
