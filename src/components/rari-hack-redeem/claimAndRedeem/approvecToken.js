import React, { useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import IERC20 from "../../../abi/IERC20.json"






export default function ApproveCToken(props) {
    const [done, setDone] = useState(false)
    const account = useAccount().address


    /// check if approved already






    /// Transaction to set approve
    const { config, error } = usePrepareContractWrite({
        addressOrName: props.contractAddress,
        contractInterface: IERC20,
        functionName: 'approve',
        args: [account, props.value],
        onError(error) {
            console.log('Error prepareContractWrite', error)
        },
    })
    const { signData, signIsLoading, signIsSuccess, write } = useContractWrite(
        {
            ...config,
            onError(error) {
                console.log("error", error)
            },
            onSettled(data, error) {
                console.log("settled", data, error)
            },
            onSuccess(data) {
                console.log("success", data)
                props.liftApproveState()
                setDone(true)
            }
        })




    return (
        <button onClick={() => write()} disabled={done}>Approve</button>
    )
}


