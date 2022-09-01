import React from "react";
import { render } from "react-dom";





export default function Row(props) {


    return <tr>
            <td title="tooltip tavu">
                {props.cToken}
            </td>
            <td className="text-center" title="tooltip tavu2">
                {props.balance}
            </td>
        </tr>
}