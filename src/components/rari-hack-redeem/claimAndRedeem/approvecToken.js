import React, { useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import IERC20 from"../../../abi/IERC20.json"






export default function ApproveCToken(props){
    const [value, setValue] = useState(props.value || 0)
    const account = useAccount().address
    console.log("value in approve is", value)
    console.log("account in approve is", account)
    console.log("contract address in approve is", props.contractAddress)


/// check if approved already






/// Transaction to set approve
const { config, error } = usePrepareContractWrite({
    addressOrName: props.contractAddress,
    contractInterface: IERC20,
    functionName: 'approve',
    args: [account, value],
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
        }
    })




    return(
        <div><button onClick={()=> write()}>Approve</button></div>
    )
}


