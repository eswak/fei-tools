import React from "react";




export function RedeemingCheck(props){


    return(
        <p>
        <span>Did you double check you redeemed all you wanted?</span>
        <p><button onClick={()=>props.isReady()}> Yes </button></p>
        </p>

    )
}