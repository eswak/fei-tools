import React from 'react';
import { useAccount, useProvider, useSigner } from 'wagmi';

export const withWagmiHooksHOC = (Component) => {
  return (props) => {
    const account = useAccount().address;
    const isConnected = useAccount().isConnected;
    const provider = useProvider();
    const signer = useSigner().data;

    return <Component account={account} provider={provider} isConnected={isConnected} signer={signer} {...props} />;
  };
};
