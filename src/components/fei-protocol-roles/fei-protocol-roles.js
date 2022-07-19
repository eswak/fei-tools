import React, { Component } from 'react';
//import CompoundingStaker from '../compounding-staker/main';
import Collateralization from '../collateralization/main';
import CompoundingStakerOld from '../compounding-staker/old';
import TxToasts from '../tx-toasts/tx-toasts';
import './main-content.css';

class MainContent extends Component {
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
    switch(this.props.content.type) {
      case '/CompoundingStaker':
        return <CompoundingStakerOld />;
      case '/CollateralizationOracle':
        return <Collateralization />;
      default:
        return (
          <div className="card section">
            <h1>Fei Tools</h1>
            <p className="mt-3">
              This website hosts third-party tools to interact with <a href="https://fei.money/">Fei Protocol</a> and more broadly the Tribe DAO products.
            </p>
            <p>These tools are created by TRIBE community members, get in touch with Eswak if you want to suggest changes or add a tool to this website.</p>
            <p className="mb-0">
              <a className="btn" href="#/CollateralizationOracle">Collateralization Oracle</a>
            </p>
            <p className="mb-0">
              <a className="btn" href="#/FeiProtocolRoles">Fei Protocol Roles</a>
            </p>
            <hr/>
            <p className="mb-0">
              <div>Deprecated tools :</div>
              <a className="btn" href="#/CompoundingStaker">CompoundingStaker</a>
              <div style={{color:'#D32F2F'}}>DO NOT DEPOSIT FUNDS IN THIS TOOL, REWARDS ARE NOT ACCRUING ANYMORE, USE ONLY FOR WITHDRAWAL.</div>
            </p>
          </div>
        );
    }
  }
}

export default MainContent;