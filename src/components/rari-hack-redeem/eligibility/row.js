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
                {formatNumber(props.balance)}
            </a>
        </td>
        <td className="text-right" title={'Wei: ' + props.rate}>
            {formatRate(props.rate)}
        </td>
        <td className="text-right">
            {formatNumber(props.fei)}
        </td>
    </tr>
}

// format a number to XX,XXX,XXX
function formatNumber(n) {
    return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}

// format a rate with 6 decimals
function formatRate(n) {
    var ret = Math.floor(n / 1e12) / 1e6;
    ret = ret.toString();
    while (ret.length < 8) ret = ret + '0';
    if (ret > 2) ret = Math.floor(ret * 1000) / 1000;
    if (ret > 10) ret = Math.floor(ret * 100) / 100;
    if (ret > 100) ret = Math.floor(ret * 10) / 10;
    if (ret > 1000) ret = Math.floor(ret);
    return ret;
}
