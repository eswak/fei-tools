import React, { useState } from "react";
import ApproveCToken, { CheckCToken } from "./approvecToken";



export default function ClaimRow(props) {
    const [value, setValue] = useState(props.balance || 0)
    const [approve, setApprove] = useState(false)
    const [disableButton, setDisableButton] = useState(false)

    function handleChange(event) {
        setValue(event.target.value)
        props.updateNumber(props.cToken, event.target.value)
    }


    function approveCToken() {
        setApprove(true)
        setDisableButton(true)
        props.approve(props.cToken)
        
    }

    return (
        <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center">
                {props.balance}
            </td>
            <td>
                <input type="string" disabled={disableButton} id={props.cToken} value={value} onChange={handleChange} />
            </td>
            <td>
                <button disabled={disableButton} onClick={()=>approveCToken()}>Lock</button>
            </td>
        </tr>
    )
}