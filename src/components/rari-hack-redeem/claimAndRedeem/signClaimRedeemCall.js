import React, { useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import MultiMerkleRedeemer from "../../../abi/MultiMerkleRedeemer.json"
import roots from "../data/roots.json"



export default function SignClaimRedeemCall(props) {
    const [redeemState, setRedeemState] = useState(true)
    const [merkleProofs, setMerkleProofs] = useState([])
    const [disableButton, setDisableButton] = useState(false)

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
    const cTokens = props.toRedeem.map(item => item.cToken)

    ////2. _amountsToClaim
    const amountsToClaim = props.toRedeem.map(item => item.balance)

    ////3. _amountsToRedeem
    const amountsToRedeem = props.toRedeem.map(item => item.balance)

    ////4. _merkeProofs
    /////see inside redeem function








    /// Transaction to sign and claim and redeem
    const account = useAccount().address
    const { config, error } = usePrepareContractWrite({
        addressOrName: props.contractAddress,
        contractInterface: MultiMerkleRedeemer,
        functionName: 'signAndClaimAndRedeem',
        args: [props.signedMessage, cTokens, amountsToClaim, amountsToRedeem, merkleProofs],
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


    //function to be called by the button
    function redeem() {
        setDisableButton(true)
        if (checkredeem() == true) {
            //GETTING THE MERKLE ROOTS
            console.log("ctokens is", cTokens)
            for (let i = 0; i < cTokens.length; i++) {
                setMerkleProofs(merkleProofs => [...merkleProofs, roots[cTokens[i]]])
            }
        }
        write()
    }


    function log() {
        console.log("signed message is", props.signedMessage)
        console.log("to redeem is", props.toRedeem)
        console.log("cTokens is", cTokens)
        console.log("roots", roots)


    }


    return (<div>
        {redeemState == false ? <span>You are trying to redeem more than you have.</span> : null}
        <br />
        <p>Before clicking make sure you have approved all cToken transfers, else the transaction will fail.</p>
        <p>
            <button disabled={disableButton} onClick={() => redeem()}> Claim and Redeem </button>
        </p>
    </div>
    )
}