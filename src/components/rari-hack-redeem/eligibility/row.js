import React from "react";

export default function Row(props) {
    return <tr>
            <td title={props.cToken}>
                {props.cTokenLabel}
            </td>
            <td className="text-center" title="tooltip tavu2">
                {props.balance}
            </td>
        </tr>
}