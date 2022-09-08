import React, { useState } from "react";



export default function RedeemRow(props) {


    return (
        <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center">
                {props.balance}
            </td>
        </tr>
    )
}