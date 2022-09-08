import { checkProperties } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import proofs from "../../data/proofs.json"
import Call from "./call";



export default function SignClaimRedeemCall(props) {
    const [redeemState, setRedeemState] = useState(true)
    const [merkleProofs, setMerkleProofs] = useState([])
    const address = useAccount().address


    ///SMART CONTRACT FUNCTION FOR REFERENCE
    /// @notice Combines sign, claim, and redeem into a single function
    /// @param _signature the user's signature, encoded as a 65-length bytes: bytes.concat(bytes32(r), bytes32(s), bytes1(v));
    /// @param _cTokens the cTokens being claimed
    /// @param _amountsToClaim the amounts of each cToken to claim; should match the merkle proofs
    /// @param _amountsToRedeem the amounts of each cToken to redeem; must be greater than 0 for each cToken provided
    /// @param _merkleProofs the merkle proofs for each claim
    ///////////////////////////////////
    // function signAndClaimAndRedeem(
    //     bytes calldata _signature,
    //     address[] calldata _cTokens,
    //     uint256[] calldata _amountsToClaim,
    //     uint256[] calldata _amountsToRedeem,
    //     bytes32[][] calldata _merkleProofs
    // ) external virtual;
    ///////////////////////////////////

    //// Function to check if the user is trying to redeem more than he can
    function checkredeem() {
        ////check if inputed values are inferior or equal to redeemable
        for (let i = 0; props.toRedeem.length; i++) {
            if (props.toRedeem[i]["balance"] <= props.redeemable[i]["balance"]) {
                setRedeemState(true)
                return true
            }
            else {
                setRedeemState(false)
                return false
            }
        }

    }

    /// DATA TRANSFORMATION INTO INPUTS
    ////0. signature
    //// signature is in props.signedMessage
    ////1. _cTokens
    const cTokens = props.toRedeem.reduce(function(accu, curr){
        if(curr.approved == true) accu.push(curr.cToken);
        return accu;
    }, []);

    ////2. _amountsToClaim
    const amountsToClaim = props.toRedeem.reduce(function(accu, curr){
        if(curr.approved == true) accu.push(curr.balance);
        return accu;
    }, []);

    ////3. _amountsToRedeem
    const amountsToRedeem = props.toRedeem.reduce(function(accu, curr){
        if(curr.approved == true) accu.push(curr.balance);
        return accu;
    }, []);

    ////4. _merkeProofs
    useEffect(() => {
        for (let i = 0; i < cTokens.length; i++) {
            setMerkleProofs(merkleProofs => [...merkleProofs, proofs[cTokens[i]][address]])
        }
    }, props.toRedeem);

    return (<div>
        {redeemState == false ? <span>You are trying to redeem more than you have.</span> : null}
        <br />
        <p>Before clicking make sure you have approved all cToken transfers, else the transaction will fail.</p>
        <p>
            <Call contractAddress={props.contractAddress} signedMessage={props.signedMessage} cTokens={cTokens} amountsToClaim={amountsToClaim} amountsToRedeem={amountsToRedeem} merkleProofs={merkleProofs} />
        </p>
    </div>
    )
}
