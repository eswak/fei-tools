import React from "react";






export default function ApproveCToken(props){

function handleApprove(){
    props.liftApproveState()
}



    return(
        <div><button onClick={()=> handleApprove()}>Approve</button></div>
    )
}


