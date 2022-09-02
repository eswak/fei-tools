import React from "react";
import ClaimRow from "./claimRow";


export function ClaimAndRedeem(props) {


    console.log("claim and redeem", props.redeemableTokens)
    return (
        <div>
            <p>How many tokens do you want to redeem?</p>
            <table className="mb-3">
                <thead>
                    <tr>
                        <th>cToken</th>
                        <th className="text-center">Balance</th>
                        <th>Claiming</th>
                    </tr>
                </thead>
                <tbody>
                    {props.redeemableTokens.map((instance, i) => {
                        return <ClaimRow rowkey={i} cToken={instance.cToken} cTokenLabel={instance.cTokenLabel} balance={instance.balance} />
                    })
                    }
                </tbody>
            </table>

        </div>
    )
}