import React, { Component } from 'react';
//import CompoundingStaker from '../compounding-staker/main';
import Collateralization from '../collateralization/main';
import SafeAddresses from '../safeaddresses/main';
import TimelockTransactions from '../timelock/main';
import TxToasts from '../tx-toasts/tx-toasts';
import RariHackRedeem from '../rari-hack-redeem/main';
import './main-content.css';

class MainContent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="main-content">
        {this.renderSwitch()}
        <TxToasts />
      </div>
    );
  }

  renderSwitch(props) {
    switch (this.props.content.type) {
      case '/CollateralizationOracle':
        return <Collateralization />;
      case '/SafeAddresses':
        return <SafeAddresses />;
      case '/TimelockTransactions':
        return <TimelockTransactions />;
        case '/RariHackRedeem':
          return <RariHackRedeem />;
      default:
        return (
          <div className="card section">
            <h1>Fei Tools</h1>
            <p className="mt-3">
              This website hosts third-party tools to interact with <a href="https://fei.money/">Fei Protocol</a> and
              more broadly the Tribe DAO products.
            </p>
            <p>
              These tools are created by TRIBE community members, get in touch with Eswak if you want to suggest changes
              or add a tool to this website.
            </p>
            <p className="mb-0">
              <a className="btn" href="#/CollateralizationOracle">
                Fei Collateralization Oracle
              </a>
              &nbsp;
              <a className="btn" href="#/SafeAddresses">
                Fei Safe Addresses
              </a>
              &nbsp;
              <a className="btn" href="#/TimelockTransactions">
                Tribe DAO Timelocks
              </a>
            </p>
            <hr />
          </div>
        );
    }
  }
}

export default MainContent;
