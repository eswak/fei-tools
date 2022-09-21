import React from 'react';
import './main.css';
import tribeImg from './img/tribe.png';
import stEthImg from '../collateralization/img/wsteth.jpg';
import lqtyImg from './img/lqty.png';
import foxImg from './img/fox.png';
import arrowImg from './img/arrow.png';
import daiImg from '../collateralization/img/dai.jpg';
import { formatNumber } from '../../modules/utils';
import IERC20 from '../../abi/IERC20.json';
import redeemerABI from '../../abi/RedeemerContract.json';
import { ethers } from 'ethers';
import { withWagmiHooksHOC } from '../../modules/with-wagmi-hooks-hoc';
import EventEmitter from '../../modules/event-emitter';


let tribe, redeemerContract;
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
        FOX: ''
      },
      contractBalance: {
        dai: '',
        stETH: '',
        LQTY: '',
        FOX: ''
      }
    };
    tribe = new ethers.Contract('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', IERC20, props.provider);
    redeemerContract = new ethers.Contract('0xF14500d6c06af77a28746C5Bd0F0516414A23E1C', redeemerABI, props.provider);
  }
  UNSAFE_componentWillReceiveProps(props) {
    if (props.signer) {
      tribe = new ethers.Contract('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', IERC20, props.signer);
      redeemerContract = new ethers.Contract('0xF14500d6c06af77a28746C5Bd0F0516414A23E1C', redeemerABI, props.signer);
    }
  }


  onInputChange(e) {
    this.state.input.tribe = e.target.value;
    this.setState(this.state);
  }

  async componentDidMount() {
    await this.refreshData();
  }


  async refreshData() {
    // Get user TRIBE balance
    if (this.props.account) {
      console.log('get user data');
      this.state.balance.tribe = (await tribe.balanceOf(this.props.account)).toString();
      console.log('TRIBE balance of', this.state.balance.tribe / 1e18);
    } else console.log('no user data :(');

    // set state & redraw
    this.setState(this.state);
    this.forceUpdate();
  }

  /// APPROVING TRIBE TRANSFER
  getInputAmountWithDecimals() {
    let amount = this.state.input.tribe;
    if (amount === Math.round(this.state.balance.tribe / 1e18).toString()) {
      amount = this.state.balance.tribe;
    } else {
      amount = (BigInt(amount) * BigInt(1e18)).toString();
    }
    return amount;
  }

  async approveTx() {
    let amount = this.getInputAmountWithDecimals();

    const tx = await tribe.approve(redeemerContract.address, amount);
    EventEmitter.dispatch('tx', {
      label: 'Allow Tribe transfer on Tribe Redeemer',
      hash: tx.hash
    });
  }
  /// Getting output values from preview redeem
  async outputValue() {
    let amount = this.getInputAmountWithDecimals();
    const tx = await redeemerContract.previewRedeem(amount);
    console.log('preview returned', tx);
  }

  /// REDEEMING TRIBE FOR PCV
  async redeemTx() {
    let amount = this.getInputAmountWithDecimals();
    const tx = await redeemerContract.redeem(this.props.account, amount);
    EventEmitter.dispatch('tx', {
      label: 'Redeem ' + formatNumber(amount) + ' TRIBE to get PCV',
      hash: tx.hash
    });
    this.state.input.tribe = '';
    this.setState(this.state);
  }

  // BUTTON TO SET TO 100%
  setInputAmount() {
    const scaledDownAmount = (BigInt(this.state.balance.tribe) / BigInt(1e18)).toString();
    this.state.input.tribe = scaledDownAmount;
    this.setState(this.state);
  }

  render() {
    return (
      <div className="triberedeemer">
        <div className="card section">
          <h1 className="mb-3">Tribe Redeemer</h1>
          <div className="info">
            <p>The Tribe Redeemer allows the redeeming of TRIBE tokens for the underlying PCV.</p>
          </div>
          {this.props.isConnected ? (
            <div>
              <h2>Exchange Tribe for PCV</h2>
              <div className="box-wrapper">
                <div className="box">
                  <div className="balances">
                    <div className="title">Your Tribe Balance</div>
                    <div className="balance">
                      <img src={tribeImg} /> {formatNumber(this.state.balance.tribe)} Tribe
                    </div>
                    <div className="title">Contract Balances</div>
                    <div className="balance">
                      <img src={daiImg} />
                      {formatNumber(this.state.contractBalance.dai)} Dai
                    </div>
                    <div className="balance">
                      <img src={stEthImg} />
                      {formatNumber(this.state.contractBalance.stETH)} tETH
                    </div>
                    <div className="balance">
                      <img src={lqtyImg} />
                      {formatNumber(this.state.contractBalance.LQTY)} LQTY
                    </div>
                    <div className="balance">
                      <img src={foxImg} />
                      {formatNumber(this.state.contractBalance.FOX)} FOX
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
                        onClick={() => this.setInputAmount()}
                        title={'Your balance: ' + formatNumber(this.state.balance.tribe) + ' TRIBE'}
                      >
                        100%
                      </span>
                      <span className="token">
                        <img src={tribeImg} />
                      </span>
                    </div>
                    <div className='arrowBox'>
                      <img src={arrowImg} className="arrow" />
                    </div>
                    <div className="outputs">

                      <div className="title">Outputs</div>
                      <div className="output">
                        <img src={daiImg} />
                        {formatNumber(this.state.output.dai)} Dai
                      </div>
                      <div className="output">
                        <img src={stEthImg} />
                        {formatNumber(this.state.output.stETH)} tETH
                      </div>
                      <div className="output">
                        <img src={lqtyImg} />
                        {formatNumber(this.state.output.LQTY)} LQTY
                      </div>
                      <div className="output">
                        <img src={foxImg} />
                        {formatNumber(this.state.output.FOX)} FOX
                      </div>
                    </div>
                  </div>
                  <div className="action-box">
                    <button onClick={() => this.approveTx()}>Approve TRIBE Transfer</button>
                    <button onClick={() => this.redeemTx()}>Redeem</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <span>please connect your wallet</span>
          )}
        </div>
        <pre>{JSON.stringify(this.state, null, 2)}</pre>
      </div>
    );
  }
}

export default withWagmiHooksHOC(TribeRedeemer);
