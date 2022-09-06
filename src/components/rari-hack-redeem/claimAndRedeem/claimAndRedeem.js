import React, { useState } from "react";
import ClaimRow from "./claimRow";


export function ClaimAndRedeem(props) {

    const [redeemable, setRedeemable] = useState(props.redeemableTokens)
    const [wantRedeem, setWantRedeem] = useState(props.redeemableTokens)
    const [redeemState, setRedeemState] = useState(null)



    // function to handle value change in the form
    function updateWantRedeem(cToken, value) {
        setWantRedeem(previousArray => {
            return previousArray.map((item, i) => {
                return item.cToken === cToken ? { ...item, balance: value } : item
            })
        })
        console.log("WantRedeem is now", wantRedeem)
    }


    function redeem() {
        console.log("button want redeem:", wantRedeem)
        console.log("redeemable", redeemable)
        ////check if inputed values are inferior or equal to redeemable
        for (let i = 0; wantRedeem.length; i++) {
            if (wantRedeem[i]["balance"] <= redeemable[i]["balance"]) {
                console.log("ok")
            }
            else {
                setRedeemState("error, you are trying to claim more than you can")
            }
        }

    }

    return (
        <div>
            <p>How many tokens do you want to redeem?</p>
            <table className="mb-3">
                <thead>
                    <tr>
                        <th>cToken</th>
                        <th className="text-center">Balance</th>
                        <th>Claiming</th>
                        <th>Approve Transfer</th>
                        <th>Transfer Approved?</th>
                    </tr>
                </thead>
                <tbody>
                    {props.redeemableTokens.map((instance, i) => {
                        return <ClaimRow updateNumber={updateWantRedeem} rowkey={i} key={i} cToken={instance.cToken} cTokenLabel={instance.cTokenLabel} balance={instance.balance} />
                    })
                    }
                </tbody>
            </table>
            <p><button onClick={redeem}> Claim and Redeem </button></p>
            {redeemState !== null ? <span>{redeemState}</span> : null}

        </div>
    )
}