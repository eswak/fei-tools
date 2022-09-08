import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useContractWrite, usePrepareContractWrite, useProvider } from 'wagmi';
import IERC20 from '../../../abi/IERC20.json';

export default function ApproveRow(props) {
    const [allowance, setAllowance] = useState(null);
    const [approved, setApproved] = useState(false);
    const account = useAccount().address;
    const provider = useProvider();

    // Check for past approval
    if (allowance == null) {
        const ctoken = new ethers.Contract(props.cToken, IERC20, provider);
        ctoken.allowance(account, props.contractAddress).then(function(allowance) {
            setAllowance(allowance.toString());
            if (allowance.toString() == props.balance) setApproved(true);
        });
    }

    /// Transaction to set approve
    const { config } = usePrepareContractWrite({
        addressOrName: props.cToken,
        contractInterface: IERC20,
        functionName: 'approve',
        args: [props.contractAddress, props.balance],
        onError(error) {
            console.log('Error prepareContractWrite', error)
        },
    });
    const { write: writeApprove } = useContractWrite({
        ...config,
        onError(/*error*/) {},
        onSettled(/*data, error*/) {},
        onSuccess(/*data*/) {
            setApproved(true);
        }
    });

    return (
        <tr className={(props.rowkey % 2 ? 'odd' : 'even')}>
            <td style={{'whiteSpace':'nowrap'}}>{props.cTokenLabel}</td>
            <td className="text-right" title={'Wei: ' + props.balance}>
                {formatNumber(props.balance)}
            </td>
            <td className="text-right">
                <button onClick={() => writeApprove()} disabled={approved}>Approve</button>
            </td>
            <td className="text-left" title={'Allowance = ' + allowance + ', expected ' + props.balance}>
                {approved == true ? <span>✅</span> : <span>❌</span>}
            </td>
        </tr>
    )
}

// format a number to XX,XXX,XXX
function formatNumber(n) {
    return String(Math.floor(n / 1e18)).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}