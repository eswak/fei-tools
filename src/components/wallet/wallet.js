import React, { Component } from 'react';
import './wallet.css';
import metamaskLogo from './metamask-logo.png';
import { ethers } from 'ethers';
import EventEmitter from '../../modules/event-emitter';

var intervalRefresh = null;
var account = null;
var provider;
if (window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  window.ethereum.on('networkChanged', () => window.location.reload());
} else {
  provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT');
}
const signer = provider.getSigner();

class Wallet extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ethereum: typeof window.ethereum !== 'undefined',
      accounts: [],
      block: null
    };
  }

  async componentDidMount() {
    intervalRefresh = setInterval(async () => {
      this.state.block = await provider.getBlockNumber();
      this.state.accounts = await provider.listAccounts();
      var previousAccount = account;
      account = this.state.accounts[0];
      if (previousAccount !== account && account !== undefined) {
        EventEmitter.dispatch('AccountChange', {
          old: previousAccount,
          new: account
        });
        previousAccount = account;
      }
      this.setState(this.state);
      this.forceUpdate();
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(intervalRefresh);
  }

  connectAccounts() {
    window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  render() {
    return (
      <div>
        { !this.state.ethereum ? <a className="wallet" href="https://metamask.io/" target="_blank">
          <img src={metamaskLogo} />
          <span className="error">
            Click to install Metamask
          </span>
        </a> : null }
        { (this.state.ethereum && !this.state.accounts.length) ? <a className="wallet" onClick={()=>this.connectAccounts()}>
          <img src={metamaskLogo} />
          Connect wallet
        </a> : null }
        { (this.state.ethereum && this.state.accounts.length) ? <a className="wallet">
          <img src={metamaskLogo} />
          <span title={account}>
            {account.slice(0,6)}...{account.slice(-4)}
          </span>
          <span className="indicator-connected" title={'Connected. Last block : ' + this.state.block}></span>
        </a> : null }
      </div>
    );
  }
}

export default Wallet;
export function getAccount() { return account };
export function getProvider() { return provider };
export function getSigner() { return signer };
