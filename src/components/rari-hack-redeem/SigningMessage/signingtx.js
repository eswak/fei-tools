import React, { useState } from "react";
import { usePrepareContractWrite, useContractWrite, ChainDoesNotSupportMulticallError, useProvider, useSigner } from "wagmi";
import MultiMerkleRedeemer from "../../../abi/MultiMerkleRedeemer.json"



const contractAddress = "0xfd2cf3b56a73c75a7535ffe44ebabe7723c64719"


export default function SigningTx(props){
    ///2. SIGNING


    const [provider, setProvider] = useState(useProvider())
    const [signer, setSigner] = useState(useSigner())
    console.log("signer is", signer)



    const { config, error } = usePrepareContractWrite({
        addressOrName: contractAddress,
        contractInterface: MultiMerkleRedeemer,
        functionName: 'sign',
        args: props.data,
        onError(error) {
            console.log('Error prepareContractWrite', error)
            console.log("data is", props.data)
          },
    })
    const { signData, signIsLoading, signIsSuccess, write } = useContractWrite(
        {
            ...config,
            onError(error) {
                console.log("error", error)
                console.log("provider chain id is", provider.getNetwork())
                console.log("signer chain id is", signer.getChainId())
            },
            onSettled(data, error) {
                console.log("settled", data, error)
            },
            onSuccess(data) {
                console.log("success", data)
            }
        })

        return(
            <button onClick={() => write()}>
                        Sign TX
                    </button>
        )
}