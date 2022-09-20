import React from 'react';
import './main.css';
import tribeImg from './img/tribe.png';
import stEthImg from '../collateralization/img/wsteth.jpg';
import lqtyImg from './img/lqty.png';
import foxImg from './img/fox.png';
import daiImg from '../collateralization/img/dai.jpg';
import { formatNumber } from '../../modules/utils';
import { useAccount, useSigner } from 'wagmi';
import IERC20 from '../../abi/IERC20.json';
import { ethers } from 'ethers';
import { getProvider, getSigner, getAccount } from '../wallet/wallet';
import { TribeRedeemHooks } from './hook-wrapper';

const tribe = new ethers.Contract('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', IERC20, getSigner());




class TribeRedeemer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: {
        tribe: ''
      },
      balance: {
        tribe: ''
      },
      output: {
        dai: '',
        stETH: '',
        LQTY: '',
        FOX: '',
      }
    };
  };
  onInputChange(e) {
    this.state.input.tribe = e.target.value;
    this.setState(this.state);
  }

  async componentDidMount() {
    await this.refreshData();
    console.log("props are", this.props)
  };

  async refreshData() {
    // Get user TRIBE balance
    if (this.props.account) {
      console.log('get user data');
      this.state.balance.tribe = (await tribe.balanceOf(this.props.account)).toString();
      console.log('TRIBE balance of', this.state.props, this.state.balance.tribe / 1e18);
    } else console.log('no user data :(');


    // set state & redraw
    this.setState(this.state);
    this.forceUpdate();
  };

  render() {
    return (
      <div className="triberedeemer">
        <div className="card section">
          <h1 className="mb-3">Tribe Redeemer</h1>
          <div className="info">
            <p>The Tribe Redeemer allows the redeeming of TRIBE tokens for the underlying PCV.</p>
          </div>
          {this.props.isConnected ?
            <div>
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
                        onChange={(e) => this.onInputChange(e)}
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
                    <div className="outputs">
                      <div className="title">Outputs</div>
                      <div className='output'>
                        <img src={daiImg} />{formatNumber(this.state.balance.tribe)}
                        Dai
                      </div>
                      <div className='output'>
                        <img src={stEthImg} />{formatNumber(this.state.balance.tribe)}
                        stETH
                      </div>
                      <div className='output'>
                        <img src={lqtyImg} />{formatNumber(this.state.balance.tribe)}
                        LQTY
                      </div>
                      <div className='output'>
                        <img src={foxImg} />{formatNumber(this.state.balance.tribe)}
                        FOX
                      </div>
                    </div>
                  </div>
                  <div className="action-box">
                    <button onClick={() => console.log('approve Tribe transfer')}>Approve TRIBE Transfer</button>
                    <button onClick={() => console.log('Redeem')}>Redeem</button>
                  </div>
                </div>
              </div>
            </div> : <span>please connect your wallet</span>}

        </div>
        <pre>{JSON.stringify(this.state, null, 2)}</pre>
      </div>
    );
  }
}

export default TribeRedeemHooks(TribeRedeemer);
