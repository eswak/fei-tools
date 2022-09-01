import React from "react";
import { render } from "react-dom";





export default function Row(props) {


    return render(
        <tr>
            <td title="tooltip tavu">
                {this.props.cToken}
            </td>
            <td className="text-center" title="tooltip tavu2">
                {this.props.balance}
            </td>
        </tr>
    )
}