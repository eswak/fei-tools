import React from "react";
import { useAccount } from "wagmi";








export const TribeRedeemHooks = (Component) => {
    return (props) => {
        const { address, isConnected, isDisconnected } = useAccount();
        return <Component address={address} isConnected={isConnected} {...props}/>;
    };
}

