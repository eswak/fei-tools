import React, { Component } from 'react';
//import CompoundingStaker from '../compounding-staker/main';
import Collateralization from '../collateralization/main';
import SafeAddresses from '../safeaddresses/main';
import TimelockTransactions from '../timelock/main';
import FeiProtocolRoles from '../fei-protocol-roles/main';
import FeiDaiPSM from '../fei-dai-psm/main';
import TxToasts from '../tx-toasts/tx-toasts';
import RariHackRedeem from '../rari-hack-redeem/main';
import TribeRedeemer from '../tribe-redeemer/main';
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
      case '/FeiProtocolRoles':
        return <FeiProtocolRoles />;
      case '/FeiDaiPSM':
        return <FeiDaiPSM />;
      case '/TribeRedeemer':
        return <TribeRedeemer />;
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
              These tools are created by <a target="_blank" href="https://tribedao.xyz/governance/proposals/FIP-83">
                La Tribu
              </a>, a collective of developers working for the Tribe DAO.
            </p>
            <p>
              Get in touch with Eswak if you want to suggest changes or add a tool to this website.
            </p>
            <p>
              Navigate to the various tools by using the left menu.
            </p>
          </div>
        );
    }
  }
}

export default MainContent;
