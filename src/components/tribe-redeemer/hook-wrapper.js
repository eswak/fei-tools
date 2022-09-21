import React from 'react';
import { useAccount, useSigner } from 'wagmi';

export const TribeRedeemHooks = (Component) => {
  return (props) => {
    const { address, isConnected, isDisconnected } = useAccount();
    const { signer } = useSigner();
    return <Component address={address} isConnected={isConnected} signer={signer} {...props} />;
  };
};
