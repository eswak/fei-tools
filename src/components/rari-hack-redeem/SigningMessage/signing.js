import { ethers } from 'ethers';
import React, { useState } from 'react';
import { useProvider, useSignMessage, useAccount, usePrepareContractWrite, useContractWrite } from 'wagmi';
import MultiMerkleRedeemer from '../../../abi/MultiMerkleRedeemer.json';

export function SigningMessage(props) {

    const [signedMessage, setSignedMessage] = useState(null);
    const account = useAccount();
    const provider = useProvider();
    const message = `Sample message, please update.`

    // Sign message
    let { isLoading, signMessage } = useSignMessage({
        message,
        onSettled(data, error) {
            if (error) return;
            setSignedMessage(data);
            props.liftMessageData(data);
        }
    });

    // Checking for past signature
    const redeemer = new ethers.Contract(props.contractAddress, MultiMerkleRedeemer, provider);
    redeemer.userSignatures(account.address).then(function(userSignature) {
        if (userSignature === '0x') return;
        setSignedMessage(userSignature);
        props.liftMessageData(userSignature);
        props.liftAlreadySigned();
    }).catch((err) => {
        console.error('Error fetching user signature:', err);
    });

    if (signedMessage) {
        return (
            <div>
                <p>You have signed the following message:</p>
                <p style={{'background':'#eee', 'borderLeft':'5px solid #aaa', 'padding': '5px', 'whiteSpace': 'pre-line'}}>{message}</p>
                <p>Your signature:</p>
                <p style={{'background':'#eee', 'borderLeft':'5px solid #aaa', 'padding': '5px', 'whiteSpace': 'pre-line', 'fontFamily': 'monospace'}}>{signedMessage}</p>
            </div>
        );
    }

    return (
        <div>
            <p>
                In order to be eligible for compensation, please sign the following message:
            </p>
            <p style={{'background':'#eee', 'borderLeft':'5px solid #aaa', 'padding': '5px', 'whiteSpace': 'pre-line'}}>{message}</p>
            <div>
                <button disabled={isLoading} onClick={() => signMessage()}>
                    Sign message
                </button>
            </div>
        </div>
    );
}