import React from 'react';
import './main.css';
import tribeImg from './img/tribe.png';
import { formatNumber } from '../../modules/utils';

class TribeRedeemer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: {
        tribe: ''
      },
      balance: {
        tribe: '0'
      }
    };
  }

  async componentWillMount() {}

  render() {
    return (
      <div className="triberedeemer">
        <div className="card section">
          <h1 className="mb-3">Tribe Redeemer</h1>
          <div className="info">
            <p>The Tribe Redeemer allows the redeeming of TRIBE tokens for the underlying PCV.</p>
          </div>
          <h2>Exchange Tribe for PCV</h2>
          <div className="box-wrapper">
            <div className="box">
              <div className="balances">
                <div className="title">Your Tribe Balance</div>
                <div className="balance">
                  <img src={tribeImg} /> {formatNumber(this.state.balance.tribe)} Tribe
                </div>
              </div>
              <div className="tabs">
                <div className="tab active">Redeem</div>
              </div>
              <div className="content">
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="0"
                    value={this.state.input.tribe}
                    onChange={() => console.log('change')}
                  />
                  <span
                    className="all"
                    onClick={() => console.log('all')}
                    title={'Your balance: ' + formatNumber(this.state.balance.tribe) + ' TRIBE'}
                  >
                    100%
                  </span>
                  <span className="token">
                    <img src={tribeImg} />
                  </span>
                </div>
                <div className="output-box">
                  <p>Output placeholder</p>
                </div>
              </div>
              <div className="action-box">
                <button onClick={() => console.log('approve Tribe transfer')}>Approve TRIBE Transfer</button>
                <button onClick={() => console.log('Redeem')}>Redeem</button>
              </div>
            </div>
          </div>
        </div>
        <pre>{JSON.stringify(this.state, null, 2)}</pre>
      </div>
    );
  }
}

export default TribeRedeemer;
