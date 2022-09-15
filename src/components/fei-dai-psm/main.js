import React from 'react';
import { ethers } from 'ethers';
import IERC20 from '../../abi/IERC20.json';
import SimpleFeiDaiPSMABI from '../../abi/SimpleFeiDaiPSM.json';
import feiImg from '../collateralization/img/fei.png';
import daiImg from '../collateralization/img/dai.jpg';
import arrow1Img from './img/arrow1.png';
import arrow2Img from './img/arrow2.png';
import './main.css';
import EventEmitter from '../../modules/event-emitter';
import { formatNumber } from '../../modules/utils';
import { getProvider, getSigner, getAccount } from '../wallet/wallet';

const psm = new ethers.Contract('0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2', SimpleFeiDaiPSMABI, getSigner());
const dai = new ethers.Contract('0x6B175474E89094C44Da98b954EedeAC495271d0F', IERC20, getSigner());
const fei = new ethers.Contract('0x956F47F50A910163D8BF957Cf5846D573E7f87CA', IERC20, getSigner());

console.log('provider', getProvider());

class c extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: getAccount(),
      tab: 'mint',
      input: {
        dai: '',
        fei: ''
      },
      allowance: {
        dai: '0',
        fei: '0'
      },
      balance: {
        dai: '0',
        fei: '0'
      },
      events: []
    };
  }

  async componentWillMount() {
    await this.refreshData();

    EventEmitter.on('AccountChange', (data) => {
      console.log('AccountChange', data.new);
      this.state.account = data.new;
      this.setState(this.state);
      this.refreshData();
    });

    EventEmitter.on('TxMined', (data) => {
      console.log('TxMined', data.hash);
      this.refreshData();
    });
  }

  async refreshData() {
    console.log('refreshData()');
    let newEvents = [];
    // Collect mints
    (await psm.queryFilter(psm.filters.Mint())).forEach(function (mint) {
      newEvents.push({
        hash: mint.transactionHash,
        timestamp: null,
        block: mint.blockNumber,
        to: mint.args.to,
        type: 'mint',
        fei: mint.args.amountIn.toString()
      });
    });
    // Collect redeems
    (await psm.queryFilter(psm.filters.Redeem())).forEach(function (redeem) {
      newEvents.push({
        hash: redeem.transactionHash,
        timestamp: null,
        block: redeem.blockNumber,
        to: redeem.args.to,
        type: 'redeem',
        fei: redeem.args.amountFeiIn.toString()
      });
    });
    // Sort mints & redeems
    newEvents = newEvents
      .sort(function (a, b) {
        return a.block < b.block ? 1 : -1;
      })
      .slice(0, 20);
    this.state.events = newEvents;

    // get user data
    if (this.state.account) {
      console.log('get user data');
      this.state.allowance.fei = (await fei.allowance(this.state.account, psm.address)).toString();
      this.state.allowance.dai = (await dai.allowance(this.state.account, psm.address)).toString();
      this.state.balance.fei = (await fei.balanceOf(this.state.account)).toString();
      this.state.balance.dai = (await dai.balanceOf(this.state.account)).toString();
      console.log('FEI balance of', this.state.account, this.state.balance.fei / 1e18);
    } else console.log('no user data :(');

    // set state & redraw
    this.setState(this.state);
    this.forceUpdate();
  }

  setActiveTab(tab) {
    this.state.tab = tab;
    this.setState(this.state);
  }

  setInputAmount(token, amount) {
    const scaledDownAmount = (BigInt(amount) / BigInt(1e18)).toString();
    this.state.input[token] = scaledDownAmount;
    this.setState(this.state);
  }

  onInputChange(token, e) {
    this.state.input[token] = e.target.value;
    this.setState(this.state);
  }

  getInputAmountWithDecimals(token) {
    let amount = this.state.input[token];
    if (amount === Math.round(this.state.balance[token] / 1e18).toString()) {
      amount = this.state.balance[token];
    } else {
      amount = (BigInt(amount) * BigInt(1e18)).toString();
    }
    return amount;
  }

  async approveTx(token) {
    let amount = this.getInputAmountWithDecimals(token);

    const tx = await (token == 'dai' ? dai : fei).approve(psm.address, amount);
    EventEmitter.dispatch('tx', {
      label: 'Allow ' + token.toUpperCase() + ' on PSM',
      hash: tx.hash
    });
  }

  async redeemTx() {
    let amount = this.getInputAmountWithDecimals('fei');

    const tx = await psm.redeem(this.state.account, amount, '0' /*amount*/);
    EventEmitter.dispatch('tx', {
      label: 'Redeem ' + formatNumber(amount) + ' FEI to get DAI',
      hash: tx.hash
    });
    this.state.input.fei = '';
    this.setState(this.state);
  }

  async mintTx() {
    let amount = this.getInputAmountWithDecimals('dai');

    const tx = await psm.mint(this.state.account, amount, '0' /*amount*/);
    EventEmitter.dispatch('tx', {
      label: 'Mint ' + formatNumber(amount) + ' FEI by spending DAI',
      hash: tx.hash
    });
    this.state.input.dai = '';
    this.setState(this.state);
  }

  render() {
    return (
      <div className="feidaipsm">
        <div className="card section">
          <h1 className="mb-3">FEI-DAI PSM</h1>
          <div className="info">
            <p>
              The FEI-DAI{' '}
              <a href={'https://etherscan.io/address/' + psm.address} target="_blank">
                Peg Stability Module (PSM)
              </a>{' '}
              allows to mint 1 FEI by providing 1 DAI, and redeem 1 FEI for 1 DAI.
            </p>
            <p>This contract is immutable and will have the effect of pegging 1 FEI to the price of 1 DAI forever.</p>
          </div>
          <h2>Exchange {this.state.tab == 'mint' ? 'DAI to FEI' : 'FEI to DAI'}</h2>
          <div className="box-wrapper">
            <div className="box">
              <div className="balances">
                <div className="title">Your Balances</div>
                <div className="balance">
                  <img src={feiImg} /> {formatNumber(this.state.balance.fei)} FEI
                </div>
                <div className="balance">
                  <img src={daiImg} /> {formatNumber(this.state.balance.dai)} DAI
                </div>
              </div>
              <div className="tabs">
                <div
                  className={'tab ' + (this.state.tab == 'mint' ? 'active' : '')}
                  onClick={() => this.setActiveTab('mint')}
                >
                  Mint
                </div>
                <div
                  className={'tab ' + (this.state.tab == 'redeem' ? 'active' : '')}
                  onClick={() => this.setActiveTab('redeem')}
                >
                  Redeem
                </div>
              </div>
              <div className="content">
                {this.state.tab == 'redeem' ? (
                  <div className="input-box">
                    <input
                      type="text"
                      placeholder="0"
                      value={this.state.input.fei}
                      onChange={(e) => this.onInputChange('fei', e)}
                    />
                    <span
                      className="all"
                      onClick={() => this.setInputAmount('fei', this.state.balance.fei)}
                      title={'Your balance: ' + formatNumber(this.state.balance.fei) + ' FEI'}
                    >
                      100%
                    </span>
                    <span className="token">
                      <img src={feiImg} />
                    </span>
                  </div>
                ) : (
                  <div className="input-box">
                    <input
                      type="text"
                      placeholder="0"
                      value={this.state.input.dai}
                      onChange={(e) => this.onInputChange('dai', e)}
                    />
                    <span
                      className="all"
                      onClick={() => this.setInputAmount('dai', this.state.balance.dai)}
                      title={'Your balance: ' + formatNumber(this.state.balance.dai) + ' DAI'}
                    >
                      100%
                    </span>
                    <span className="token">
                      <img src={daiImg} />
                    </span>
                  </div>
                )}
                <div className="output-box">
                  <img src={this.state.tab == 'redeem' ? arrow2Img : arrow1Img} className="arrow" />
                  <br />
                  <img src={this.state.tab == 'redeem' ? daiImg : feiImg} className="token" />
                  <div className="out">
                    {this.state.tab == 'mint'
                      ? formatNumber(this.state.input.dai * 1e18)
                      : formatNumber(this.state.input.fei * 1e18)}
                  </div>
                </div>
                <div className="action-box">
                  {this.state.tab == 'redeem' ? (
                    <button
                      disabled={this.state.allowance.fei / 1e18 >= this.state.input.fei}
                      onClick={() => this.approveTx('fei')}
                    >
                      Approve FEI Transfer
                    </button>
                  ) : (
                    <button
                      disabled={this.state.allowance.dai / 1e18 >= this.state.input.dai}
                      onClick={() => this.approveTx('dai')}
                    >
                      Approve DAI Transfer
                    </button>
                  )}
                  {this.state.tab == 'redeem' ? (
                    <button
                      disabled={
                        Number(this.state.input.fei) == 0 || this.state.allowance.fei / 1e18 < this.state.input.fei
                      }
                      onClick={() => this.redeemTx()}
                    >
                      Redeem
                    </button>
                  ) : (
                    <button
                      disabled={
                        Number(this.state.input.dai) == 0 || this.state.allowance.dai / 1e18 < this.state.input.dai
                      }
                      onClick={() => this.mintTx()}
                    >
                      Mint
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="events">
            <h2>Last Mint and Redeem events :</h2>
            <table style={{ maxWidth: '500px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {this.state.events.map((event, i) => (
                  <tr key={i}>
                    <td>
                      <a href={'https://etherscan.io/tx/' + event.hash}>
                        {new Date(event.timestamp * 1000).toISOString().split('T')[0]}
                      </a>
                    </td>
                    <td>{event.type == 'mint' ? 'Mint' : 'Redeem'}</td>
                    <td className="text-right">{formatNumber(event.fei)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <pre>{JSON.stringify(this.state, null, 2)}</pre>
        </div>
      </div>
    );
  }
}

export default c;
