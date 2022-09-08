import React from "react";




export function RedeemingCheck(props){


    return(
        <div>
        <span>Did you double check the amounts and approved transfers for all cTokens you wanted?</span>
        <p><button onClick={()=>props.isReady()}> Yes, claim and redeem </button></p>
        </div>

    )
}