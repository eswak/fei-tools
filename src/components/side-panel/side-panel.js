import React, { Component } from 'react';
import logo from './logo.png';
import './side-panel.css';
import { ConnectKitButton } from 'connectkit';

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
        <div className="text-center cpointer" onClick={() => this.goTo('#')}>
          <img className="logo" src={logo} />
        </div>
        <div className="version mb-2">Made with 💚 by La Tribu.</div>
        <hr />
        <span className="connectbutton">
          <ConnectKitButton showBalance="true" showAvatar="true" />
        </span>
        <hr />
        { Date.now() > 1664150400000 ? <div>
          <a href="#/FeiDaiPSM" className={'menu-item' + (document.location.hash == '#/FeiDaiPSM' ? ' active' : '')}>
            <span className="ml-1">FEI-DAI PSM</span>
          </a>
          <hr />
          <a
            href="#/TribeRedeemer"
            className={'menu-item' + (document.location.hash == '#/TribeRedeemer' ? ' active' : '')}
          >
            <span className="ml-1">Tribe Redeemer</span>
          </a>
        </div> : null }
        <a
          href="#/RariHackRedeem"
          className={'menu-item' + (document.location.hash == '#/RariHackRedeem' ? ' active' : '')}
        >
          <span className="ml-1">Rari Hack Redeemer</span>
        </a>
        <hr />
        <a
          href="#/CollateralizationOracle"
          className={'menu-item' + (document.location.hash == '#/CollateralizationOracle' ? ' active' : '')}
        >
          <span className="ml-1">Fei Collateralization Oracle</span>
        </a>
        <a
          href="#/SafeAddresses"
          className={'menu-item' + (document.location.hash == '#/SafeAddresses' ? ' active' : '')}
        >
          <span className="ml-1">Fei Safe Addresses</span>
        </a>
        <a
          href="#/TimelockTransactions"
          className={'menu-item' + (document.location.hash == '#/TimelockTransactions' ? ' active' : '')}
        >
          <span className="ml-1">Tribe DAO Timelocks</span>
        </a>
        <a
          href="#/FeiProtocolRoles"
          className={'menu-item' + (document.location.hash == '#/FeiProtocolRoles' ? ' active' : '')}
        >
          <span className="ml-1">Fei Protocol Roles</span>
        </a>
        <hr />
        <a href="#" className={'menu-item' + (document.location.hash == '' ? ' active' : '')}>
          <span className="ml-1">About</span>
        </a>
        <hr />
      </div>
    );
  }
}

export default SidePanel;
