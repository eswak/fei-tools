import React, { useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import MultiMerkleRedeemer from "../../../abi/MultiMerkleRedeemer.json"



export default function SignClaimRedeemCall(props) {
    const [redeemState, setRedeemState] = useState(true)

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
        console.log("button want redeem:", props.toRedeem)
        console.log("redeemable", props.redeemable)
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

    /// Transaction to sign and claim and redeem
    const account = useAccount().address
    const { config, error } = usePrepareContractWrite({
        addressOrName: props.contractAddress,
        contractInterface: MultiMerkleRedeemer,
        functionName: 'signAndClaimAndRedeem',
        args: [account, props.toRedeem],
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
        function redeem(){
            if(checkredeem() == true){
                write()
            }
            else {
                console.log("error trying to send transaction")
            }

        }




    return (<div>
        {redeemState == false ? <span>You are trying to redeem more than you have.</span> : null}
        <button  onClick={redeem}> Claim and Redeem </button>
    </div>

    )
}