import React, { Component } from 'react';
import CompoundingStaker from '../compounding-staker/compounding-staker';
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
        return <CompoundingStaker />;
      default:
        return (
          <div className="p1">
            <h1>Fei Tools</h1>
            <p className="mt-3">
              This website hosts third-party tools to interact with <a href="https://fei.money/">Fei Protocol</a>.
            </p>
            <p>These tools are created by <a href="https://tribe.fei.money/u/eswak/summary">Eswak</a>, a member of the TRIBE community that also contributes to the <a href="https://github.com/fei-protocol/fei-protocol-core/pull/100">core protocol</a>.</p>
            <p>More tools will be added over time, but for now, there is only one. You can use it and find its documentation here :</p>
            <p>
              <a className="btn" href="#/CompoundingStaker">CompoundingStaker</a>
            </p>
          </div>
        );
    }
  }
}

export default MainContent;
