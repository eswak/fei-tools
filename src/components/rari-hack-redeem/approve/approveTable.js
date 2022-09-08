import React, { useState, useEffect } from "react";
import ApproveRow from "./approveRow";

export function ApproveTable(props) {
    return (
        <div>
            <p>Approve your cTokens on the settlement smart contract.</p>
            <table className="mb-3">
                <thead>
                    <tr>
                        <th>cToken</th>
                        <th className="text-right">Amount redeemable</th>
                        <th className="text-center" colSpan="2">Approve amount redeemable</th>
                    </tr>
                </thead>
                <tbody>
                    {props.redeemableTokens.map((instance, i) => {
                        return <ApproveRow key={i} contractAddress={props.contractAddress} cToken={instance.cToken} cTokenLabel={instance.cTokenLabel} balance={instance.balance} />
                    })}
                </tbody>
            </table>
        </div>
    );
}