import React, { Component } from 'react';
import logo from './logo.png';
import './side-panel.css';
import Wallet from '../wallet/wallet';

class SidePanel extends Component {
  constructor(props) {
    super(props);
  }

  goTo(hash) {
    document.location.hash = hash;
  }

  render() {
    return (
      <div className="side-panel">
        <div className="text-center cpointer" onClick={()=>this.goTo('#')}>
          <img className="logo" src={logo} />
        </div>
        <div className="version mb-2">
          Made with 💚 by <a href="https://github.com/eswak">eswak</a>.
        </div>
        <Wallet />
        <a href="#" className={'menu-item' + (document.location.hash == '' ? ' active' : '')}>
          <span className="ml-1">About</span>
        </a>
        <a href="#/CollateralizationOracle" className={'menu-item' + (document.location.hash == '#/CollateralizationOracle' ? ' active' : '')}>
          <span className="ml-1">Collateralization Oracle</span>
        </a>
      </div>
    );
  }
}

export default SidePanel;