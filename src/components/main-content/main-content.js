import React, { Component } from 'react';
import CompoundingStakerDeposit from '../compounding-staker/deposit';
import './main-content.css';

class MainContent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="main-content">
        {this.renderSwitch()}
      </div>
    );
  }

  renderSwitch(props) {
    switch(this.props.content.type) {
      case '/CompoundingStaker':
        return <CompoundingStakerDeposit />;
      default:
        return (
          <pre className="p1">{JSON.stringify(this.props, null, 2)}</pre>
        );
    }
  }
}

export default MainContent;
