import { ethers } from "ethers"
import { solidityKeccak256 } from "ethers/lib/utils"
import React, { useState } from "react"
import { useProvider, useSignMessage, useSigner, usePrepareContractWrite, useContractWrite, useAccount, useContractRead } from 'wagmi'
import MultiMerkleRedeemer from "../../../abi/MultiMerkleRedeemer.json"

export function SigningMessage(props) {
    const [provider, setProvider] = useState(useProvider())
    const [signedMessage, setSignedMessage] = useState(null)
    const [account, setAccount] = useState(useAccount())
    const [signed, setSigned] = useState(false)


    const signer = useSigner()


    const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
        message: 'Sample message, please update.',
        onSettled(data, error) {
            props.liftMessageData(data)
            setSignedMessage(data)
            setSigned(true)
        }
    })

    ///1. CHECKING FOR SIGNATURE
    ////Contract address :
    const contractAddress = "0xfd2cf3b56a73c75a7535ffe44ebabe7723c64719"
    //// Contract instance to check for signature:
    const readContract = new ethers.Contract(contractAddress, MultiMerkleRedeemer, provider)
    /// Checking for signature
    const contractRead = readContract.userSignatures(account.address)



    return (
    <div>{false == true ?
        <div>
            Message has already been signed
            {console.log("contractRead", contractRead)}
        </div> :
        <div>{signed==false ?
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
                </div>
            </div>
            :
            <div>
                {isSuccess && <div>
                    <p>Message signed, thank you.</p>

                </div>}
                {isError && <div>Error signing message, please reload and retry or contact us</div>}
            </div>}
        </div>
        }
        </div>)}