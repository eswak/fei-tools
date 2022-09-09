// polyfills
import 'react-app-polyfill/ie9';
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
// imports
import _ from 'lodash';
import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from './components/side-panel/side-panel';
import MainContent from './components/main-content/main-content';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
///WAGMI IMPORTS
import { chain, WagmiConfig, createClient, defaultChains, configureChains } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
//IMPORT CONNECTKIT
import { ConnectKitProvider, ConnectKitButton, getDefaultClient } from 'connectkit';

//WAGMI CONFIG
// Configure chains & providers with the Alchemy provider.
const { chains, provider, webSocketProvider } = configureChains(
  [chain.localhost],
  [
    alchemyProvider({ apiKey: '2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT' }),
    publicProvider(),
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `http://127.0.0.1:8545`
      })
    })
  ]
);

// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi'
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true
      }
    })
  ],
  provider,
  webSocketProvider
});

//END WAGMI CONFIG

class App extends Component {
  constructor(props) {
    super(props);
    this.state = this.getStateBasedOnHash();

    // Router
    window.onhashchange = () => {
      this.onHashUpdated();
    };
  }

  getStateBasedOnHash() {
    if (!window.location.hash) {
      return {
        content: { type: 'welcome' }
      };
    }

    const type = window.location.hash.split('-')[0].replace('#', '');
    return {
      content: {
        type: decodeURI(type) || null,
        data: decodeURI(window.location.hash.replace('#' + type, '').replace(/^-/, '')) || null
      }
    };
  }

  onHashUpdated() {
    //console.log('app.js onHashUpdated:', window.location.hash);
    this.setState(this.getStateBasedOnHash());
  }

  render() {
    return (
      <WagmiConfig client={client}>
        <ConnectKitProvider theme="retro">
          <SidePanel /> <MainContent content={this.state.content} key={window.location.hash} />
        </ConnectKitProvider>
      </WagmiConfig>
    );
  }
}

// Initialize DOM elements
document.title = 'Fei Tools';
const wrapper = document.createElement('div');
wrapper.className = 'app';
document.body.appendChild(wrapper);
const root = createRoot(wrapper);
root.render(<App />);

// Favicon
document.head.innerHTML +=
  '<link rel="icon" type="image/png" href="data:image/png;base64,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"/>';
