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
            <span>"I love the Fei Labs team and will never ever even consider taking legal actions against Fei Labs or anyone even remotely associated with it, so help me God."</span>
        </p>
        <div>
            <button disabled={isLoading} onClick={() => signMessage()}>
                Sign message
            </button>
            {isSuccess && <div>Signature: {data}</div>}
            {isError && <div>Error signing message</div>}
        </div>
    </div>)
}