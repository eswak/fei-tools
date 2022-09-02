import React, { useState } from "react";



export default function ClaimRow(props){
    const [ value, setValue ] = useState(props.balance || 0)

    function handleChange(event){
        setValue(event.target.value)
        props.updateNumber(props.cToken, event.target.value)
    }

    return(
    <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center" title="tooltip tavu2">
                {props.balance}
            </td>
            <td><input type="number" id={props.cToken} value={value} onChange={handleChange}/></td>
        </tr>
        )
}