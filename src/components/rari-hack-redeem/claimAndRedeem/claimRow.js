import React, { useState } from "react";
import ApproveCToken, { CheckCToken } from "./approvecToken";



export default function ClaimRow(props) {
    const [value, setValue] = useState(props.balance || 0)
    const [approve, setApprove] = useState(false)

    function handleChange(event) {
        setValue(event.target.value)
        props.updateNumber(props.cToken, event.target.value)
    }


    function approveCToken() {
        setApprove(true)
        console.log(approve)
    }

    return (
        <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center" title="tooltip tavu2">
                {props.balance}
            </td>
            <td>
                <input type="string" id={props.cToken} value={value} onChange={handleChange} />
            </td>
            <td>
                <ApproveCToken value={value} contractAddress={props.cToken} liftApproveState={approveCToken} />
            </td>
            <td>
            {approve == true ? <span>✅</span> : <span>❌</span>}
            </td>
        </tr>
    )
}