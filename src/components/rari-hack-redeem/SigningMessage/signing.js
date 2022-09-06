import { ethers } from "ethers"
import { solidityKeccak256 } from "ethers/lib/utils"
import React, { useState } from "react"
import { useProvider, useSignMessage, useSigner, usePrepareContractWrite, useContractWrite, useAccount, useContractRead } from 'wagmi'
import MultiMerkleRedeemer from "../../../abi/MultiMerkleRedeemer.json"
import SigningTx from "./signingtx"

export function SigningMessage(props) {
     const [provider, setProvider] = useState(useProvider())
    const [signedMessage, setSignedMessage] = useState(null)
    const [account, setAccount] = useState(useAccount())


    const signer = useSigner()

    
    const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
        message: 'Sample message, please update.',
        onSettled(data, error) {
            props.liftMessageData(data)
            setSignedMessage(data)
            console.log("signed message", data)
        }
    })

///1. CHECKING FOR SIGNATURE
    ////Contract address :
    const contractAddress = "0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd"
    //// Contract instance to check for signature:
    const readContract = new ethers.Contract(contractAddress, MultiMerkleRedeemer, provider)
    /// Checking for signature
    const contractRead = readContract.userSignatures(account.address)
 


    return (<div>{false == true ?
        <div>
            Message has already been signed
            {console.log("contractRead", contractRead)}
        </div> :
        <div>
            <p>
                <span>Please sign the following message:</span>
            </p>
            <p>
                <span>"Sample message, please update."</span>
            </p>

            <div>

                <button disabled={isLoading} onClick={() => signMessage()}>
                    Sign message
                </button>
                {isSuccess && <div>
                    <p>Message signed, please send.</p>
                    <p><SigningTx data={signedMessage}/></p>
                </div>}
                {isError && <div>Error signing message</div>}
            </div>
        </div>}
    </div>)
}