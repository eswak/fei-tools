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

// contracts used on this page
let tribe, steth, lqty, fox, dai, redeemerContract;
let timeoutFetchPreview;

// address of the TribeRedeemer
const redeemerAddress = '0xF14500d6c06af77a28746C5Bd0F0516414A23E1C';

class TribeRedeemer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redeemed: false,
      input: {
        tribe: ''
      },
      balance: {
        tribe: '',
        steth: '',
        lqty: '',
        fox: '',
        dai: ''
      },
      allowance: {
        tribe: ''
      },
      output: {
        steth: '',
        lqty: '',
        fox: '',
        dai: ''
      },
      contractBalance: {
        tribe: '',
        steth: '',
        lqty: '',
        fox: '',
        dai: ''
      }
    };
    tribe = new ethers.Contract('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', IERC20, props.provider);
    steth = new ethers.Contract('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', IERC20, props.provider);
    lqty = new ethers.Contract('0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D', IERC20, props.provider);
    fox = new ethers.Contract('0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d', IERC20, props.provider);
    dai = new ethers.Contract('0x6B175474E89094C44Da98b954EedeAC495271d0F', IERC20, props.provider);
    redeemerContract = new ethers.Contract(redeemerAddress, redeemerABI, props.provider);
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.signer) {
      tribe = new ethers.Contract('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', IERC20, props.signer);
      redeemerContract = new ethers.Contract(redeemerAddress, redeemerABI, props.signer);
      tribe = new ethers.Contract('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', IERC20, props.signer);
    }
  }
  async UNSAFE_componentWillMount() {
    await this.refreshData();

    EventEmitter.on('TxMined', (data) => {
      this.refreshData();
    });
  }

  onInputChange(e) {
    this.state.input.tribe = ((e.target.value || '').match(/^[0-9]+(\.[0-9]{0,2})?/g) || [])[0] || '';
    this.setState(this.state);
    this.updateOutputValue();
  }

  async componentDidMount() {
    await this.refreshData();
  }

  async refreshData() {
    // Get user balances
    if (this.props.account) {
      console.log('get user data');
      this.state.balance.dai = (await dai.balanceOf(this.props.account)).toString();
      this.state.balance.steth = (await steth.balanceOf(this.props.account)).toString();
      this.state.balance.lqty = (await lqty.balanceOf(this.props.account)).toString();
      this.state.balance.fox = (await fox.balanceOf(this.props.account)).toString();
      this.state.balance.tribe = (await tribe.balanceOf(this.props.account)).toString();
      this.state.allowance.tribe = (await tribe.allowance(this.props.account, redeemerAddress)).toString();

      // Get contract balances
      this.state.contractBalance.tribe = (await tribe.balanceOf(redeemerContract.address)).toString();
      this.state.contractBalance.steth = (await steth.balanceOf(redeemerContract.address)).toString();
      this.state.contractBalance.lqty = (await lqty.balanceOf(redeemerContract.address)).toString();
      this.state.contractBalance.fox = (await fox.balanceOf(redeemerContract.address)).toString();
      this.state.contractBalance.dai = (await dai.balanceOf(redeemerContract.address)).toString();
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

    const tx = await tribe.approve(redeemerAddress, amount);
    EventEmitter.dispatch('tx', {
      label: 'Allow Tribe transfer on Tribe Redeemer',
      hash: tx.hash
    });
  }
  /// Getting output values from preview redeem
  async updateOutputValue() {
    const that = this;
    let amount = this.getInputAmountWithDecimals();

    // after 500ms, fetch the previewRedeem
    clearTimeout(timeoutFetchPreview);
    timeoutFetchPreview = setTimeout(async function () {
      const previewedAmounts = await redeemerContract.previewRedeem(amount);
      that.state.output.steth = previewedAmounts.amountsOut[0].toString();
      that.state.output.lqty = previewedAmounts.amountsOut[1].toString();
      that.state.output.fox = previewedAmounts.amountsOut[2].toString();
      that.state.output.dai = previewedAmounts.amountsOut[3].toString();
      that.setState(that.state);
    }, 500);
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
    this.state.output.dai = '';
    this.state.output.steth = '';
    this.state.output.lqty = '';
    this.state.output.fox = '';
    await this.refreshData();
    this.setState(this.state);
  }

  // BUTTON TO SET TO 100%
  setInputAmount() {
    const scaledDownAmount = (BigInt(this.state.balance.tribe) / BigInt(1e18)).toString();
    this.state.input.tribe = scaledDownAmount;
    this.setState(this.state);
    this.updateOutputValue();
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
                      <img src={tribeImg} /> {formatNumber(this.state.balance.tribe, 18, 2)} TRIBE
                    </div>
                    <div className="title">Your Tokens Balances</div>
                    <div className="balance">
                      <img src={daiImg} /> {formatNumber(this.state.balance.dai)} DAI
                    </div>
                    <div className="balance">
                      <img src={stEthImg} /> {formatNumber(this.state.balance.steth)} stETH
                    </div>
                    <div className="balance">
                      <img src={lqtyImg} /> {formatNumber(this.state.balance.lqty)} LQTY
                    </div>
                    <div className="balance">
                      <img src={foxImg} /> {formatNumber(this.state.balance.fox)} FOX
                    </div>
                  </div>
                  <div className="contractbalances">
                    <div className="title">Contract Balances</div>
                    <div className="balance">
                      <img src={daiImg} /> {formatNumber(this.state.contractBalance.dai)} DAI
                    </div>
                    <div className="balance">
                      <img src={stEthImg} /> {formatNumber(this.state.contractBalance.steth)} stETH
                    </div>
                    <div className="balance">
                      <img src={lqtyImg} /> {formatNumber(this.state.contractBalance.lqty)} LQTY
                    </div>
                    <div className="balance">
                      <img src={foxImg} /> {formatNumber(this.state.contractBalance.fox)} FOX
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
                    <div className="arrowBox">
                      <img src={arrowImg} className="arrow" />
                    </div>
                    <div className="outputs">
                      <div className="title">Outputs</div>
                      <div className="output" title={'Wei: ' + this.state.output.dai}>
                        <img src={daiImg} /> {formatNumber(this.state.output.dai, 18, 2)} DAI
                      </div>
                      <div className="output" title={'Wei: ' + this.state.output.steth}>
                        <img src={stEthImg} /> {formatNumber(this.state.output.steth, 18, 4)} stETH
                      </div>
                      <div className="output" title={'Wei: ' + this.state.output.lqty}>
                        <img src={lqtyImg} /> {formatNumber(this.state.output.lqty, 18, 2)} LQTY
                      </div>
                      <div className="output" title={'Wei: ' + this.state.output.fox}>
                        <img src={foxImg} /> {formatNumber(this.state.output.fox, 18, 2)} FOX
                      </div>
                    </div>
                  </div>
                  <div className="action-box">
                    <button
                      disabled={this.state.allowance.tribe / 1e18 >= this.state.input.tribe}
                      onClick={() => this.approveTx()}
                    >
                      Approve TRIBE Transfer
                    </button>
                    <button
                      disabled={
                        Number(this.state.input.tribe) == 0 ||
                        this.state.allowance.tribe / 1e18 < this.state.input.tribe
                      }
                      onClick={() => this.redeemTx()}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <span>please connect your wallet</span>
          )}
        </div>
      </div>
    );
  }
}

export default withWagmiHooksHOC(TribeRedeemer);
