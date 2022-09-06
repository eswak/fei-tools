import { ethers } from "ethers"
import React, { useState } from "react"
import { useProvider, useSignMessage, useSigner, usePrepareContractWrite, useContractWrite } from 'wagmi'
import MultiMerkleRedeemer from "../../abi/MultiMerkleRedeemer.json"

export function SigningMessage(props) {
    const [signer, setSigner] = useState(useSigner())
    const [provider, setProvider] = useState(useProvider())
    const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
        message: 'Sample message, please update.',
        onSettled(data, error) {
            props.liftMessageData(data)
        }
    })
    ///1. CHECKING FOR SIGNATURE
    ////Contract address :
    const contractAddress = "0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd"
    //// Contract instance to check for signature:
    const readContract = new ethers.Contract(contractAddress, MultiMerkleRedeemer, provider)
    /// Checking for signature
    const usersDidSign = readContract.userSignatures("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")




    ///2. SIGNING
    const { config, error } = usePrepareContractWrite({
        addressOrName: contractAddress,
        contractInterface: MultiMerkleRedeemer,
        functionName: 'sign',
        args: data
    })
    const { signData, signIsLoading, signIsSuccess, write } = useContractWrite(
        {
            config,
            onError(error) {
                console.log("error", error)
            },
            onSettled(data, error) {
                console.log("settled", data, error)
            },
            onSuccess(data) {
                console.log("success", data)
            }
        })

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
                    <p><button onClick={() => write()}>
                        Test
                    </button></p>
                </div>}
                {isError && <div>Error signing message</div>}
            </div>
        </div>}
    </div>)
}