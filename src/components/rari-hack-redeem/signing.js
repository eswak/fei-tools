import React from "react"
import { useSignMessage } from 'wagmi'



export function SigningMessage(props) {
    const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
        message: 'lolilol',
        onSettled(data,error){
            props.liftMessageData(data)
        }
    })




    return (<div>
        <p>
            <span>Please sign the following message:</span>
        </p>
        <p>
            <span>"lolilol"</span>
        </p>
        <div>
            <button disabled={isLoading} onClick={() => signMessage()}>
                Sign message
            </button>
            {isSuccess && <div>Message signed, please choose what you want to redeem.</div>}
            {isError && <div>Error signing message</div>}
        </div>
    </div>)
}