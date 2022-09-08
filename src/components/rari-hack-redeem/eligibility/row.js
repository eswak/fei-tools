import React from 'react';
import { useAccount } from 'wagmi';

export default function Row(props) {
    const account = useAccount().address;

    return <tr className={(props.rowkey % 2 ? 'odd' : 'even')}>
        <td title={props.cToken}>
            <a href={'https://etherscan.io/address/' + props.cToken}>
                {props.cTokenLabel}
            </a>
        </td>
        <td className="text-right" title={'Wei: ' + props.balance}>
            <a href={'https://etherscan.io/token/' + props.cToken + '?a=' + account}>
                {formatNumber(props.balance / 1e8)}
            </a>
        </td>
        <td className="text-right" title={'Wei: ' + props.fei}>
            {formatNumber(props.fei / 1e18)}
        </td>
    </tr>
}

// format a number to XX,XXX,XXX
function formatNumber(n) {
    return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}
