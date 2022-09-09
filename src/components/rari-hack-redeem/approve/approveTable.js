import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useProvider } from 'wagmi';
import ApproveRow from './approveRow';
import Comptroller from '../../../abi/Comptroller.json';
import CErc20Delegate from '../../../abi/CErc20Delegate.json';
import labels from '../data/labels.json';
import comptrollers from '../data/comptrollers.json';

export function ApproveTable(props) {

    const [fuseState, setFuseState] = useState(null);

    const account = useAccount().address;
    const provider = useProvider();

    // Once, fetch Fuse state for the user
    (async(oldFuseState, setFuseState)=>{
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
                }
                if (Object.keys(fuseState[info.cToken]).length == 0) {
                    delete fuseState[info.cToken];
                }
            }
        }
        setFuseState(fuseState);
    })(fuseState, setFuseState);

    return (
        <div>
            <p>Approve your cTokens on the settlement smart contract.</p>
            <table className="mb-3">
                <thead>
                    <tr>
                        <th>cToken</th>
                        <th className="text-right">cTokens redeemable</th>
                        <th className="text-center" colSpan="2">Approve amount redeemable</th>
                    </tr>
                </thead>
                <tbody>
                    {props.redeemableTokens.map((instance, i) => {
                        return <ApproveRow key={i} contractAddress={props.contractAddress} cToken={instance.cToken} cTokenLabel={instance.cTokenLabel} balance={instance.balance} />
                    })}
                </tbody>
            </table>
            { fuseState && Object.keys(fuseState).length ? <div className="fuse-openborrows">
                <div>
                    ⚠️ Please visit the <a href="https://app.rari.capital/fuse">Fuse webapp</a> to close all outstanding Borrow Balance.
                </div>
                {Object.keys(fuseState).map(cTokenAddress => <div>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- You have an open debt that prevents you from redeeming all your [{labels[cTokenAddress.toLowerCase()]}]
                </div>)}
                <div>
                    You can Approve ctokens, but if you enter amounts too high in the Claim and redeem section, your transaction will fail.
                </div>
            </div> : null }
        </div>
    );
}