import React from "react";


export default function Row(props) {
    return <tr className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center" title="your balance">
                {props.balance}
            </td>
        </tr>
}