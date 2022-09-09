import React, { useState } from "react";



export default function RedeemRow(props) {

// format a number to XX,XXX,XXX
function formatNumber(n) {
    return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}

    return (
        <tr key={props.rowkey} className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center">
            {formatNumber(props.fei) + " fei"}
            </td>
        </tr>
    )
}