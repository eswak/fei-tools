import React from "react";



export default function ClaimRow(props){

    return(
    <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center" title="tooltip tavu2">
                {props.balance}
            </td>
            <td><input type="number" id={props.cToken} value={props.balance}/></td>
        </tr>
        )
}