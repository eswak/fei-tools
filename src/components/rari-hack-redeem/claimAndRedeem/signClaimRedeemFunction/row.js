import React, { useState } from "react";
import rates from '../../data/rates.json';



export default function RedeemRow(props) {

    console.log("props.balance is", props.balance)

// format a number to XX,XXX,XXX
function formatNumber(n) {
    return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}

    return (
        <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td align="right">
            {formatNumber(props.balance * rates[props.cToken] / 1e18) + " fei"}
            </td>
        </tr>
    )
}