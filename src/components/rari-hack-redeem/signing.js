import { ethers } from "ethers"
import React, { useState } from "react"
import { useProvider, useSignMessage, useSigner, usePrepareContractWrite, useContractWrite } from 'wagmi'
import MultiMerkleRedeemer from "../../abi/MultiMerkleRedeemer.json"
import SigningTx from "./signingtx"

export function SigningMessage(props) {
    const [signer, setSigner] = useState(useSigner())
    const [provider, setProvider] = useState(useProvider())
    const [signedMessage, setSignedMessage] = useState(null)

    
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
    const usersDidSign = readContract.userSignatures("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")


    ///Trying another way
    const account_from = {
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    };
    // Create wallet
    let wallet = new ethers.Wallet(account_from.privateKey, provider);
    // Create contract instance with signer
    const writeCon = new ethers.Contract(contractAddress, MultiMerkleRedeemer, wallet);
    function sign(){
        console.log("provider chain id is", provider.getNetwork())
        console.log("signer chain id is", wallet.getChainId())
        console.log("calling the sign function")
        const createReceipt = writeCon.sign(data)
        console.log("call result is", createReceipt)

    }

    const display = true

    return (<div>{display == false ?
        <div>
            <button onClick={() => console.log(usersDidSign)}>
                Test
            </button>
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