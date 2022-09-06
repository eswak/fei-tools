import { ethers } from "ethers"
import React, { useState } from "react"
import { useProvider, useSignMessage, useSigner } from 'wagmi'
import MultiMerkleRedeemer from "../../abi/MultiMerkleRedeemer.json"

export function SigningMessage(props) {
    const [writeContract, setWriteContract] = useState(null)
    const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
        message: 'Sample message, please update.',
        onSettled(data, error) {
            props.liftMessageData(data)
        }
    })

    const provider = useProvider()
    const signer = useSigner()
    console.log("signer is",signer)

    const contractAddress = "0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd"

    const readContract = new ethers.Contract(contractAddress, MultiMerkleRedeemer, provider)

    const usersDidSign = readContract.userSignatures("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

    function sign(){
        setWriteContract = new ethers.Contract(contractAddress, MultiMerkleRedeemer, signer)
        writeContract.sign(data)
        console.log("tried to sign")
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
                    <p><button onClick={() => sign()}>
                    Test
                </button></p>
                    </div>}
                {isError && <div>Error signing message</div>}
            </div>
        </div>}
    </div>)
}