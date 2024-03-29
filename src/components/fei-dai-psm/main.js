import React from 'react';
import { ethers, BigNumber } from 'ethers';
import IERC20 from '../../abi/IERC20.json';
import SimpleFeiDaiPSMABI from '../../abi/SimpleFeiDaiPSM.json';
import feiImg from '../collateralization/img/fei.png';
import daiImg from '../collateralization/img/dai.jpg';
import arrow1Img from './img/arrow1.png';
import arrow2Img from './img/arrow2.png';
import './main.css';
import EventEmitter from '../../modules/event-emitter';
import { formatNumber } from '../../modules/utils';
import { withWagmiHooksHOC } from '../../modules/with-wagmi-hooks-hoc';

let psm, dai, fei;
class c extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: props.account,
      loading: false,
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
      psmBalance: {
        dai: '0',
        fei: '0'
      },
      events: []
    };

    psm = new ethers.Contract('0x7842186CDd11270C4Af8C0A99A5E0589c7F249ce', SimpleFeiDaiPSMABI, props.provider);
    dai = new ethers.Contract('0x6B175474E89094C44Da98b954EedeAC495271d0F', IERC20, props.provider);
    fei = new ethers.Contract('0x956F47F50A910163D8BF957Cf5846D573E7f87CA', IERC20, props.provider);
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.signer) {
      psm = new ethers.Contract('0x7842186CDd11270C4Af8C0A99A5E0589c7F249ce', SimpleFeiDaiPSMABI, props.signer);
      dai = new ethers.Contract('0x6B175474E89094C44Da98b954EedeAC495271d0F', IERC20, props.signer);
      fei = new ethers.Contract('0x956F47F50A910163D8BF957Cf5846D573E7f87CA', IERC20, props.signer);
    }
  }

  async UNSAFE_componentWillMount() {
    await this.refreshData();

    EventEmitter.on('TxMined', (data) => {
      this.refreshData();
    });
  }

  async refreshData() {
    this.state.loading = true;
    this.setState(this.state);

    let newEvents = [];
    // Collect mints
    // event Mint(address indexed to, uint256 amountIn, uint256 amountFeiOut);
    (await psm.queryFilter(psm.filters.Mint())).forEach(function (mint) {
      newEvents.push({
        hash: mint.transactionHash,
        timestamp: null,
        block: mint.blockNumber,
        to: mint.args.to,
        type: 'mint',
        fei: mint.args.amountFeiOut.toString()
      });
    });
    // Collect redeems
    // event Redeem(address indexed to, uint256 amountFeiIn, uint256 amountAssetOut);
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
      this.state.allowance.fei = (await fei.allowance(this.state.account, psm.address)).toString();
      this.state.allowance.dai = (await dai.allowance(this.state.account, psm.address)).toString();
      this.state.balance.fei = (await fei.balanceOf(this.state.account)).toString();
      this.state.balance.dai = (await dai.balanceOf(this.state.account)).toString();
      this.state.psmBalance.fei = (await fei.balanceOf(psm.address)).toString();
      this.state.psmBalance.dai = (await dai.balanceOf(psm.address)).toString();
    }

    // set state & redraw
    this.state.loading = false;
    this.setState(this.state);
    this.forceUpdate();
  }

  setActiveTab(tab) {
    this.state.tab = tab;
    this.setState(this.state);
  }

  setInputAmount(token, amount) {
    const scaledDownAmount = Number(
      Number(BigNumber.from(amount).mul(100).div(ethers.constants.WeiPerEther).toString()) / 100
    ).toString();
    this.state.input[token] = scaledDownAmount;
    this.setState(this.state);
  }

  onInputChange(token, e) {
    this.state.input[token] = ((e.target.value || '').match(/^[0-9]+(\.[0-9]{0,2})?/g) || [])[0] || '';
    this.setState(this.state);
  }

  getInputAmountWithDecimals(token) {
    let amount = this.state.input[token];
    if (Math.round(amount).toString() === Math.round(this.state.balance[token] / 1e18).toString()) {
      amount = this.state.balance[token];
    } else {
      amount = BigNumber.from(Math.round(amount * 100))
        .mul(ethers.constants.WeiPerEther)
        .div(100)
        .toString();
    }
    return amount;
  }

  async approveTx(token) {
    let amount = this.getInputAmountWithDecimals(token);

    const tx = await (token == 'dai' ? dai : fei).approve(psm.address, amount);
    console.log('dispatch approve tx', tx);
    EventEmitter.dispatch('tx', {
      label: 'Allow ' + token.toUpperCase() + ' on PSM',
      hash: tx.hash
    });
  }

  async redeemTx() {
    let amount = this.getInputAmountWithDecimals('fei');

    const tx = await psm.redeem(this.state.account, amount, '0' /*amount*/);
    console.log('dispatch redeem tx', tx);
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
    console.log('dispatch mint tx', tx);
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
              allows to mint 1 FEI by providing 1 DAI, and redeem 1 FEI for 1 DAI (0 fees).
            </p>
            <p>This contract is immutable and will have the effect of pegging 1 FEI to 1 DAI forever.</p>
          </div>
          <h2>Exchange {this.state.tab == 'mint' ? 'DAI to FEI' : 'FEI to DAI'}</h2>
          <div className="box-wrapper">
            <div className="box">
              <div className="balances">
                <div className="title">
                  PSM Balances
                  {this.state.loading ? (
                    <div className="lds-ring">
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  ) : null}
                </div>
                <div className="balance">
                  <img src={feiImg} /> {formatNumber(this.state.psmBalance.fei, 18, 2)} FEI
                </div>
                <div className="balance">
                  <img src={daiImg} /> {formatNumber(this.state.psmBalance.dai, 18, 2)} DAI
                </div>
                <div className="title">
                  Your Balances
                </div>
                <div className="balance">
                  <img src={feiImg} /> {formatNumber(this.state.balance.fei, 18, 2)} FEI
                </div>
                <div className="balance">
                  <img src={daiImg} /> {formatNumber(this.state.balance.dai, 18, 2)} DAI
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
                    {(this.state.tab == 'mint' ? this.state.input.dai : this.state.input.fei) || '0'}
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
            <table>
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Type</th>
                  <th>Destination</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {this.state.events.map((event, i) => (
                  <tr key={i}>
                    <td>
                      <a href={'https://etherscan.io/tx/' + event.hash}>{event.block}</a>
                    </td>
                    <td>{event.type == 'mint' ? 'Mint' : 'Redeem'}</td>
                    <td style={{ fontFamily: 'monospace' }}>
                      <a href={'https://etherscan.io/address/' + event.to}>{event.to}</a>
                    </td>
                    <td className="text-right" title={'FEI Wei: ' + event.fei}>
                      {formatNumber(event.fei, 18, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default withWagmiHooksHOC(c);
