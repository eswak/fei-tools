import React from 'react';



const DisplayRow = (props) => {

    return (<tr key={props.rowkey} className={props.rowkey % 2 ? 'odd' : 'even'}>
        <td>
            {props.rolelabel}
        </td>
        <td>
            <a href={'https://etherscan.io/address/' + props.address} target="_blank">
                {props.label}
            </a>
        </td>
        <td className="text-center">
            <a href={'https://etherscan.io/tx/' + props.revokeTransaction} target="_blank">{props.grantedOn}</a>
        </td>
    </tr>)
}

export default DisplayRow;