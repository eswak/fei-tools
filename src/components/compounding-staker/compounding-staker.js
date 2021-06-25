import React, { Component } from 'react';
import './compounding-staker.css';
import { ethers } from 'ethers';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import CompoundingStakerAbi from '../../abi/CompoundingStaker.json';
import FeiTribeUniV2PairAbi from '../../abi/UniswapV2Pair.json';
import FeiTokenAbi from '../../abi/Fei.json';
import TribeTokenAbi from '../../abi/Tribe.json';
import UniswapRouterV2Abi from '../../abi/UniswapRouterV2.json';
import StakingRewardsV2 from '../../abi/StakingRewardsV2.json';
import { getProvider, getSigner, getAccount } from '../wallet/wallet';
import feiImg from './fei-token-v1-32.png';
import tribeImg from './tribe-token-v1-32.png';
import feiTribeImg from './fei-tribe-lp-token-64-96.png';
import stakerShareImg from './stonks-smol.png';
import EventEmitter from '../../modules/event-emitter';
import Wallet from '../wallet/wallet';

const tribeRewardsAddress = '0x18305DaAe09Ea2F4D51fAa33318be5978D251aBd';
const feiTokenAddress = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';
const tribeTokenAddress = '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B';
const compoundingStakerContractAddress = '0x490b9ccbeee72f960bd880386da2465b42e935d2';
const feiTribeUniV2PairAddress = '0x9928e4046d7c6513326cCeA028cD3e7a91c7590A';
const uniRouterV2Address = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
var setProgressTimeout = null;

var TribeRewards = new ethers.Contract(
  tribeRewardsAddress,
  StakingRewardsV2,
  getProvider()
);
var Fei = new ethers.Contract(
  feiTokenAddress,
  FeiTokenAbi,
  getSigner()
);
var Tribe = new ethers.Contract(
  tribeTokenAddress,
  TribeTokenAbi,
  getSigner()
);
var CompoundingStaker = new ethers.Contract(
  compoundingStakerContractAddress,
  CompoundingStakerAbi,
  getSigner()
);
var FeiTribeUniV2Pair = new ethers.Contract(
  feiTribeUniV2PairAddress,
  FeiTribeUniV2PairAbi,
  getSigner()
);
var UniswapRouterV2 = new ethers.Contract(
  uniRouterV2Address,
  UniswapRouterV2Abi,
  getSigner()
);
var intervalRefresh = null;

class CompoundingStakerDeposit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      progress: 0,
      account: getAccount(),
      pastHarvests: [],
      pastDeposits: [],
      currentTribeAPR: 0,
      form: {
        uniswap: {
          fei: '',
          tribe: ''
        },
        staker: {
          lpTokens: '',
          stTokens: ''
        }
      },
      fei: null,
      tribe: null,
      feiAllowanceUni: null,
      tribeAllowanceUni: null,
      lpAllowanceUni: null,
      lpTokensAllowanceStaker: null,
      lpTokens: null,
      lpTokensTotalSupply: null,
      stakerTokens: null,
      stakerUnclaimedTribe: null,
      stakerTokensTotalSupply: null,
      stakerStaked: null,
      reserves: [null, null] // fei, tribe
    };
  }

  async componentDidMount() {
    EventEmitter.on('AccountChange', (data) => {
      this.state.account = data.new;
      this.setState(this.state);
    });

    const etherscanProvidder = new ethers.providers.EtherscanProvider(null, 'Q1SN85UMI8HDCDREN123VZK2M6UCBMIMD4');
    const history = await etherscanProvidder.getHistory(compoundingStakerContractAddress);
    this.state.pastHarvests = history.filter((tx) => tx.data === '0x4641257d').map((tx) => {
      return {
        timestamp: tx.timestamp * 1000,
        hash: tx.hash
      };
    }).reverse().slice(0, 5);
    this.state.pastDeposits = history.filter((tx) => tx.data.indexOf('0xb6b55f25') === 0).map((tx) => {
      console.log('tx', tx);
      return {
        hash: tx.hash,
        timestamp: tx.timestamp * 1000,
        from: tx.from,
        lpTokens: Number('0x' + tx.data.replace('0xb6b55f25', '')) / 1e18
      };
    }).reverse().slice(0, 5);
    this.state.pastDeposits.forEach(async (deposit) => {
      deposit.ensName = await getProvider().lookupAddress(deposit.from);
    });

    intervalRefresh = setInterval(this.refreshData.bind(this), 5000);
    this.refreshData();
  }

  setProgress(progress) {
    if (isNaN(progress)) return;
    const self = this;
    clearTimeout(setProgressTimeout);
    setProgressTimeout = setTimeout(() => {
      self.state.progress = progress;
      self.setState(self.state);
      self.forceUpdate();
    }, 100);
  }

  async refreshData() {
    const steps = 15;
    this.setProgress(0 / steps);
    this.state.account = getAccount();
    this.setProgress(1 / steps);
    this.state.fei = (await Fei.balanceOf(getAccount())).toString();
    this.setProgress(2 / steps);
    this.state.tribe = (await Tribe.balanceOf(getAccount())).toString();
    this.setProgress(3 / steps);
    this.state.feiAllowanceUni = (await Fei.allowance(getAccount(), uniRouterV2Address)).toString();
    this.setProgress(4 / steps);
    this.state.tribeAllowanceUni = (await Tribe.allowance(getAccount(), uniRouterV2Address)).toString();
    this.setProgress(5 / steps);
    this.state.lpAllowanceUni = (await FeiTribeUniV2Pair.allowance(getAccount(), uniRouterV2Address)).toString();
    this.setProgress(6 / steps);
    this.state.lpTokensAllowanceStaker = (await FeiTribeUniV2Pair.allowance(getAccount(), compoundingStakerContractAddress)).toString();
    this.setProgress(7 / steps);
    this.state.lpTokens = (await FeiTribeUniV2Pair.balanceOf(getAccount())).toString();
    this.setProgress(8 / steps);
    this.state.lpTokensTotalSupply = (await FeiTribeUniV2Pair.totalSupply()).toString();
    this.setProgress(9 / steps);
    this.state.stakerTokens = (await CompoundingStaker.balanceOf(getAccount())).toString();
    this.setProgress(10 / steps);
    this.state.stakerUnclaimedTribe = (await TribeRewards.earned(compoundingStakerContractAddress)).toString();
    this.setProgress(11 / steps);
    this.state.stakerTokensTotalSupply = (await CompoundingStaker.totalSupply()).toString();
    this.setProgress(12 / steps);
    this.state.stakerStaked = (await CompoundingStaker.staked()).toString();
    this.setProgress(13 / steps);
    const reserves = await FeiTribeUniV2Pair.getReserves();
    this.state.reserves[0] = reserves[0].toString();
    this.state.reserves[1] = reserves[1].toString();
    this.setProgress(14 / steps);
    this.state.currentTribeAPR = await this.currentTribeAPR();
    this.setProgress(15 / steps);
    this.state.loading = false;
    this.setState(this.state);
    this.forceUpdate();
  }

  componentWillUnmount() {
    clearInterval(intervalRefresh);
    clearTimeout(setProgressTimeout);
  }

  async currentTribeAPR() {
    const lpTokenSupply = await FeiTribeUniV2Pair.totalSupply() / 1e18;
    const reserves = await FeiTribeUniV2Pair.getReserves();
    const feiReserves = reserves[0] / 1e18;
    const tribeReserves = reserves[1] / 1e18;
    const tribePriceInFei = feiReserves / tribeReserves;
    const stakedLpSupply = await FeiTribeUniV2Pair.balanceOf(tribeRewardsAddress) / 1e18;
    const rewardForDuration = await TribeRewards.getRewardForDuration() / 1e18;

    const lpTokenValue = lpTokenSupply > 0 ? (2 * feiReserves / lpTokenSupply) : 0;
    const weeklyTribeRewardPerStakedLpToken = stakedLpSupply > 0 ? (rewardForDuration / stakedLpSupply) : 0;
    const weeklyTribeRewardPerOneThousandFei = weeklyTribeRewardPerStakedLpToken * 1000 / lpTokenValue;
    const fullApr = weeklyTribeRewardPerOneThousandFei * tribePriceInFei * 52 / 1000;

    return fullApr;
  }

  onFeiChange(e) {
    const balanceFei = BigNumber(this.state.fei).dividedBy(1e18);
    const balanceTribe = BigNumber(this.state.tribe).dividedBy(1e18);
    const tribePerFei = BigNumber(this.state.reserves[1]).dividedBy(BigNumber(this.state.reserves[0]));
    var newFeiAmount = BigNumber(e);
    if (balanceFei.isLessThan(newFeiAmount)) {
      newFeiAmount = balanceFei;
    }
    var newTribeAmount = newFeiAmount.multipliedBy(tribePerFei);
    if (newTribeAmount.isGreaterThan(balanceTribe)) {
      newTribeAmount = balanceTribe;
      newFeiAmount = newTribeAmount.dividedBy(tribePerFei);
    }
    this.state.form.uniswap.fei = newFeiAmount.toFixed();
    this.state.form.uniswap.tribe = newTribeAmount.toFixed();
    if (this.state.form.uniswap.fei === 'NaN') this.state.form.uniswap.fei = '0';
    if (this.state.form.uniswap.tribe === 'NaN') this.state.form.uniswap.tribe = '0';
    this.setState(this.state);
  }

  onTribeChange(e) {
    const balanceFei = BigNumber(this.state.fei).dividedBy(1e18);
    const balanceTribe = BigNumber(this.state.tribe).dividedBy(1e18);
    const tribePerFei = BigNumber(this.state.reserves[1]).dividedBy(BigNumber(this.state.reserves[0]));
    var newTribeAmount = BigNumber(e);
    if (balanceTribe.isLessThan(newTribeAmount)) {
      newTribeAmount = balanceTribe;
    }
    var newFeiAmount = newTribeAmount.dividedBy(tribePerFei);
    if (newFeiAmount.isGreaterThan(balanceFei)) {
      newFeiAmount = balanceFei;
      newTribeAmount = newFeiAmount.multipliedBy(tribePerFei);
    }
    this.state.form.uniswap.fei = newFeiAmount.toFixed();
    this.state.form.uniswap.tribe = newTribeAmount.toFixed();
    if (this.state.form.uniswap.fei === 'NaN') this.state.form.uniswap.fei = '0';
    if (this.state.form.uniswap.tribe === 'NaN') this.state.form.uniswap.tribe = '0';
    this.setState(this.state);
  }

  onLpTokensChange(e) {
    const balanceLp = BigNumber(this.state.lpTokens).dividedBy(1e18);
    var newValInput = BigNumber(e);
    var newAmount = newValInput;
    if (balanceLp.isLessThan(newValInput)) {
      newAmount = balanceLp;
    }
    if (!newAmount.isNaN() && e !== '0.') {
      this.state.form.staker.lpTokens = newAmount.toFixed();
      this.setState(this.state);
    } else {
      this.state.form.staker.lpTokens = e;
    }
  }

  onStTokensChange(e) {
    const balanceSt = BigNumber(this.state.stakerTokens).dividedBy(1e18);
    var newValInput = BigNumber(e);
    var newAmount = newValInput;
    if (balanceSt.isLessThan(newValInput)) {
      newAmount = balanceSt;
    }
    if (!newAmount.isNaN() && e !== '0.') {
      this.state.form.staker.stTokens = newAmount.toFixed();
      this.setState(this.state);
    } else {
      this.state.form.staker.stTokens = e;
    }
  }

  async allowFeiOnUniswap() {
    const tx = await Fei.approve(
      uniRouterV2Address,
      ethers.constants.MaxUint256
    );
    EventEmitter.dispatch('tx', {
      label: 'Allow FEI on Uniswap',
      hash: tx.hash
    });
  }

  async allowTribeOnUniswap() {
    const tx = await Tribe.approve(
      uniRouterV2Address,
      ethers.constants.MaxUint256
    );
    EventEmitter.dispatch('tx', {
      label: 'Allow TRIBE on Uniswap',
      hash: tx.hash
    });
  }

  async allowLpOnUniswap() {
    const tx = await FeiTribeUniV2Pair.approve(
      uniRouterV2Address,
      ethers.constants.MaxUint256
    );
    EventEmitter.dispatch('tx', {
      label: 'Allow LP-Tokens on Uniswap',
      hash: tx.hash
    });
  }

  async allowLpTokensOnStaker() {
    const tx = await FeiTribeUniV2Pair.approve(
      compoundingStakerContractAddress,
      ethers.constants.MaxUint256
    );
    EventEmitter.dispatch('tx', {
      label: 'Allow LP-Tokens on CompoundingStaker',
      hash: tx.hash
    });
  }

  async uniswapAddLiquidity() {
    const tx = await UniswapRouterV2.addLiquidity(
      feiTokenAddress,
      tribeTokenAddress,
      BigNumber(this.state.form.uniswap.fei).multipliedBy(1e18).integerValue().toFixed(),
      BigNumber(this.state.form.uniswap.tribe).multipliedBy(1e18).integerValue().toFixed(),
      BigNumber(this.state.form.uniswap.fei).multipliedBy(1e18).multipliedBy(0.99).integerValue().toFixed(),
      BigNumber(this.state.form.uniswap.tribe).multipliedBy(1e18).multipliedBy(0.99).integerValue().toFixed(),
      getAccount(),
      (Math.floor(Date.now() / 1000) + 600).toString()
    );
    EventEmitter.dispatch('tx', {
      label: 'Add Liquidity on Uniswap',
      hash: tx.hash
    });
  }
  async uniswapRemoveLiquidity() {
    const reserves = await FeiTribeUniV2Pair.getReserves();
    const reserveFei = BigNumber(reserves[0].toString());
    const reserveTribe = BigNumber(reserves[1].toString());
    const totalSupply = await FeiTribeUniV2Pair.totalSupply();
    const balance = await FeiTribeUniV2Pair.balanceOf(getAccount());
    const share = BigNumber(balance.toString()).dividedBy(BigNumber(totalSupply.toString()));
    const slippage = BigNumber('0.95');

    const tx = await UniswapRouterV2.removeLiquidity(
      feiTokenAddress,
      tribeTokenAddress,
      BigNumber(this.state.form.staker.lpTokens).multipliedBy(1e18).integerValue().toFixed(),
      reserveFei.multipliedBy(share).multipliedBy(slippage).integerValue().toFixed(),
      reserveTribe.multipliedBy(share).multipliedBy(slippage).integerValue().toFixed(),
      getAccount(),
      (Math.floor(Date.now() / 1000) + 600).toString()
    );
    EventEmitter.dispatch('tx', {
      label: 'Remove Liquidity on Uniswap',
      hash: tx.hash
    });
  }

  depositMax() {
    this.onTribeChange(this.state.tribe);
  }

  depositMaxLp() {
    this.onLpTokensChange(this.state.lpTokens);
  }

  withdrawMaxLp() {
    this.onStTokensChange(this.state.stakerTokens);
  }

  async stakerDeposit() {
    const tx = await CompoundingStaker.deposit(
      BigNumber(this.state.form.staker.lpTokens).multipliedBy(1e18).integerValue().toFixed()
    );
    EventEmitter.dispatch('tx', {
      label: 'Deposit in CompoundingStaker',
      hash: tx.hash
    });
  }

  async stakerHarvest() {
    const tx = await CompoundingStaker.harvest();
    EventEmitter.dispatch('tx', {
      label: 'Harvest for CompoundingStaker',
      hash: tx.hash
    });
  }

  async stakerWithdraw() {
    const tx = await CompoundingStaker.withdraw(
      BigNumber(this.state.form.staker.stTokens).multipliedBy(1e18).integerValue().toFixed()
    );
    EventEmitter.dispatch('tx', {
      label: 'Withdraw from CompoundingStaker',
      hash: tx.hash
    });
  }

  render() {
    return (
      <div className="compounding-staker">
        <h1 className="mb-3">CompoundingStaker</h1>
        <div className="info">
          <p><strong>Tl;dr</strong>: this tool has only 5-6% performance fees on <img src={tribeImg}/> TRIBE rewards, and it can boost your APY by ~60% 😊</p>
          <p>This page is intended to be a self-documenting dapp. See also the <a href="https://tribe.fei.money/t/project-live-on-mainnet-staking-pool-to-earn-1-6x-more-apy/3325" target="_blank">forum post</a>.</p>
          <p>Code is available on <a href="https://etherscan.io/address/0x490b9ccbeee72f960bd880386da2465b42e935d2#code" target="_blank">Etherscan</a> and <a href="https://github.com/eswak/fei-protocol-core/pull/1" target="_blank">Github</a>. Reviewed by community members, but no audit yet: <u>use at your own risk</u>.</p>
        </div>
        <div className="mb-3 info">
          <h2>Step 0 : Understand what this is about</h2>
          <p>Fei Protocol has an active <a href="https://app.fei.money/stake" target="_blank">Liquidity mining</a> program, where you can earn <img src={tribeImg}/> TRIBE tokens if you stake <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens.</p>
          <p>If you just earn <img src={tribeImg}/> TRIBE and keep them, you will earn <img src={tribeImg}/> TRIBE tokens <strong>linearly</strong> over time (good!). But if you regularly sell some of your earnt <img src={tribeImg}/> TRIBE to get <img src={feiImg}/> FEI, then use them to provide liquidity on Uniswap V2, and stake these additional <img src={feiTribeImg}/> FEI-TRIBE Uniswap LP tokens, you will earn <strong>exponentially</strong> more rewards (better!).</p>
          <p>Over the course of 1 year, I estimate <strong>you will earn ~60% more</strong> if you regularly compound your rewards. But compounding rewards costs a lot of gas, so it is not very convenient to do regularly if you are alone.</p>
          <p>I made this tool so we can pool together and share the cost of compounding.</p>
          <p>The current <img src={tribeImg}/> TRIBE rewards are <strong>{_.round(this.state.currentTribeAPR*100, 2)}% APR</strong>, but with compounding, we could earn <strong>{_.round((1+(this.state.currentTribeAPR*0.95)/52)**52*100-100, 2)}% APR</strong> ! The <img src={tribeImg}/> TRIBE rewards are decreasing over time, so over the course of 1 year, we will earn less than that. But it shows you how powerful regular compounding with low fees can be.</p>
          <p>The CompoundingStaker works similarly to Pickle jars and Yearn Vaults, but with a much lower fee. These platforms usually keep 10-20% of the rewards for their DAO, and sometimes even have deposit/withdrawal fees. The CompoundingStaker has a 5% fee on <img src={tribeImg}/> TRIBE rewards collected (to cover gas costs) and no deposit/withdraw fees. The <a href="https://github.com/eswak/fei-protocol-core/pull/1/commits/8cff36f26059f8b7f6590d0002564d6d01f9e215#diff-abd2122d96e76334185a4441bbb8b4b454193ba26f88137e75306cc9a0539374R162-R170" target="_blank">dust</a> after swap (slippage) is also sent to the owner of the contract, so the fee is a bit more than 5% (surely less than 6%).</p>
          <p>When you deposit <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens, you will get <img src={stakerShareImg}/> Compounding Staker Shares. Over time, when the rewards are compounded, your <img src={stakerShareImg}/> Compounding Staker Shares will be worth more and more <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens. So when you withdraw, you will get more <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens than what you originally deposited, and these tokens will be worth more than what you would have got if you just claimed the <img src={tribeImg}/> TRIBE rewards by yourself.</p>
          <p>The code of the CompoundingStaker is very minimal (<a href={'https://etherscan.io/address/' + compoundingStakerContractAddress} target="_blank">150 lines of code</a>), with bits from Pickle's <a href="https://github.com/pickle-finance/protocol/blob/master/src/pickle-jar.sol" target="_blank">jar</a>/<a href="https://github.com/pickle-finance/protocol/blob/master/src/strategies/strategy-fei-farm-base.sol" target="_blank">strategy</a> and Fei Protocol's <a href="https://github.com/fei-protocol/fei-protocol-core/pull/100" target="_blank">PCVSwapperUniswap</a>, both audited projects. But <strong className="danger">the code of the CompoundingStaker is not audited</strong>. If enough people pool with me, I will use the fee on <img src={tribeImg}/> TRIBE rewards to pay an audit, for the peace of mind.</p>
          <p><u>Risk</u>: if I were to lose my private key, or turn evil, I could never call the <code>harvest()</code> function. In that case, you can always take back your <img src={feiTribeImg}/> LP tokens, but I could keep the <img src={tribeImg}/> TRIBE tokens farmed with them since the last <code>harvest()</code>. To mitigate that trust risk, I commit to a minimum of 1 <code>harvest()</code> call every week. If after 10 days you see no <code>harvest()</code> calls, get out of the pool (and call an ambulance for me please 😂). The more people pool, the more often <code>harvest()</code> will be called, so that risk should fade away over time. Last harvest was <strong>{this.state.pastHarvests.length ? (((Date.now() - this.state.pastHarvests[0].timestamp) > 259200000 ? (_.round((Date.now() - this.state.pastHarvests[0].timestamp) / (24*36e5)) + ' days ago') : (_.round((Date.now() - this.state.pastHarvests[0].timestamp) / 36e5) + ' hours ago'))) : '?'}</strong>.</p>
          <p>Currently, the CompoundingStaker pools <img src={feiTribeImg}/> <strong>{_.round(this.state.stakerStaked / 1e18, 0)}</strong> LP tokens ≈ <strong>{BigNumber(this.state.stakerStaked * 2 * this.state.reserves[0] / this.state.lpTokensTotalSupply / 1e18).toFormat(0)}</strong> FEI, and has <strong>{_.round(this.state.stakerUnclaimedTribe / 1e18, 2)}</strong> unclaimed <img src={tribeImg}/> TRIBE rewards.</p>
          <p></p>
          <p className="mb-0">Last people that joined the gang (<code>deposit</code> calls):</p>
          <ul>
            { this.state.pastDeposits.map((deposit, i) => <li key={i}>
              <span>{new Date(deposit.timestamp).toISOString().replace('T', ' ').replace('.000Z', ' GMT')}</span>
              : <a href={'https://etherscan.io/tx/' + deposit.hash} target="_blank" className="text-monospace">
                { deposit.ensName ? deposit.ensName : (deposit.from.slice(0, 6) + '...' + deposit.from.slice(-4)) }
              </a>
              &nbsp;pooled tokens worth ≈&nbsp;
              <strong>{BigNumber(deposit.lpTokens * 2 * this.state.reserves[0] / this.state.lpTokensTotalSupply).toFormat(0)}</strong> FEI
            </li>)}
          </ul>
          <p className="mb-0">Current prices :</p>
          <ul>
            <li><img src={feiImg}/> <strong>1</strong> FEI = <img src={feiImg}/> <strong>1</strong> FEI 😏</li>
            <li><img src={tribeImg}/> <strong>1</strong> TRIBE ≈ <img src={feiImg}/> <strong>{BigNumber(this.state.reserves[0] / this.state.reserves[1]).toFormat(3)}</strong> FEI</li>
            <li><img style={{marginLeft:'-5px'}} src={feiTribeImg}/> <strong>1</strong> FEI-TRIBE Uniswap LP token ≈ <img src={feiImg}/> <strong>{BigNumber(2 * this.state.reserves[0] / this.state.lpTokensTotalSupply).toFormat(3)}</strong> FEI</li>
            <li><img src={stakerShareImg}/> <strong>1</strong> Compounding Staker Share ≈ <img src={feiTribeImg}/> <strong>{BigNumber(this.state.stakerStaked / this.state.stakerTokensTotalSupply).toFormat(3)}</strong> LP tokens ≈ <img src={feiImg}/> <strong>{BigNumber((this.state.stakerStaked / this.state.stakerTokensTotalSupply) * 2 * this.state.reserves[0] / this.state.lpTokensTotalSupply).toFormat(3)}</strong> FEI</li>
          </ul>
        </div>
        <div className="mb-3">
          <h2>Step 1 : Get LP tokens by providing liquidity on Uniswap-v2</h2>
          <p>
            You can also do this step <a target="_blank" href="https://app.uniswap.org/#/add/v2/0x956f47f50a910163d8bf957cf5846d573e7f87ca/0xc7283b66eb1eb5fb86327f08e1b5816b0720212b">
              on the Uniswap interface
            </a>.
          </p>
          <div className="balance">
            <div>Input of this step currently in your wallet:</div>
            <ul className="mb-0">
              <li><img src={feiImg}/><strong>{_.round(this.state.fei / 1e18, 2)}</strong> FEI</li>
              <li><img src={tribeImg}/><strong>{_.round(this.state.tribe / 1e18, 2)}</strong> TRIBE</li>
            </ul>
            <div>Output of this step currently in your wallet:</div>
            <ul>
              <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 LP tokens</li>
            </ul>
          </div>
          <p className="info">You need an equal value of <img src={feiImg}/> FEI and <img src={tribeImg}/> TRIBE to add liquidity.</p>
          <p>
            Add liquidity for FEI and TRIBE on Uniswap v2 to get more LP tokens : <a href="javascript:void(0)" onClick={()=>this.depositMax()}>max</a>
          </p>
          <div>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <span className="input-group-text prefix">
                  <img src={feiImg}/>
                </span>
              </div>

              <input type="text" placeholder="0.0" className="form-control" value={this.state.form.uniswap.fei} onChange={(e)=>this.onFeiChange(e.target.value)} />
            </div>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <span className="input-group-text prefix">
                  <img src={tribeImg}/>
                </span>
              </div>

              <input type="text" placeholder="0.0" className="form-control" value={this.state.form.uniswap.tribe} onChange={(e)=>this.onTribeChange(e.target.value)} />
            </div>
            <div className="mb-2">
              { (this.state.form.uniswap.fei * 1e18 > this.state.feiAllowanceUni * 1) ? <div className="mb-3">
                <button onClick={()=>this.allowFeiOnUniswap()} className="btn mr-2">
                  🔓 Allow FEI on Uniswap-v2
                </button>
              </div> : null }
              { (this.state.form.uniswap.tribe * 1e18 > this.state.tribeAllowanceUni * 1) ? <div className="mb-3">
                <button onClick={()=>this.allowTribeOnUniswap()} className="btn mr-2">
                  🔓 Allow TRIBE on Uniswap-v2
                </button>
              </div> : null }
              { ((this.state.form.uniswap.fei * 1e18 <= this.state.feiAllowanceUni * 1) &&
                (this.state.form.uniswap.tribe * 1e18 <= this.state.tribeAllowanceUni * 1)) ? <div className="mb-3">
                <button onClick={()=>this.uniswapAddLiquidity()} disabled={this.state.form.uniswap.fei <= 0 || this.state.form.uniswap.tribe <= 0 ? 'disabled' : null} className="btn">
                  🦄 Add liquidity on Uniswap-v2
                </button>
              </div> : null }
            </div>
          </div>
        </div>
        <div className="mb-3">
          <h2>Step 2 : Deposit LP tokens in CompoundingStaker</h2>
          <p className="info">
            The CompoundingStaker is deployed at <a href={'https://etherscan.io/address/' + compoundingStakerContractAddress} target="_blank">{compoundingStakerContractAddress.slice(0,6)}...{compoundingStakerContractAddress.slice(-4)}</a> and currently manages <strong>{_.round(this.state.stakerStaked / 1e18)}</strong> <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens.
          </p>
          <div className="balance">
            <div>Input of this step currently in your wallet:</div>
            <ul className="mb-0">
              <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 LP tokens</li>
            </ul>
            <div>Output of this step currently in your wallet:</div>
            <ul>
              <li><img src={stakerShareImg}/><strong>{_.round(this.state.stakerTokens / 1e18, 2)}</strong> Compounding Staker Shares</li>
            </ul>
          </div>
          <p>
            Deposit FEI-TRIBE Uniswap V2 tokens to start earning rewards : <a href="javascript:void(0)" onClick={()=>this.depositMaxLp()}>max</a>
          </p>
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span className="input-group-text prefix">
                <img src={feiTribeImg}/>
              </span>
            </div>

            <input type="text" placeholder="0.0" className="form-control" value={this.state.form.staker.lpTokens} onChange={(e)=>this.onLpTokensChange(e.target.value)} />
          </div>
          <div className="mb-2">
            { (this.state.form.staker.lpTokens * 1e18 > this.state.lpTokensAllowanceStaker * 1) ? <button onClick={()=>this.allowLpTokensOnStaker()} className="btn">
              🔓 Allow FEI-TRIBE Uniswap V2 LP tokens on CompoundingStaker
            </button> : null }
            { (this.state.form.staker.lpTokens * 1e18 <= this.state.lpTokensAllowanceStaker * 1) ? <button onClick={()=>this.stakerDeposit()} disabled={this.state.form.staker.lpTokens <= 1e-10 ? 'disabled' : null} className="btn">
              🌾 Start farming ! (Deposit LP tokens on CompoundingStaker)
            </button> : null }
          </div>
        </div>
        <div className="mb-3">
          <h2>Step 3 : ???</h2>
          <p>Nothing to do here.</p>
          <p className="info">You relax and wait while your number of <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens grow.</p>
          <p className="info">The CompoundingStaker continuously earns <img src={tribeImg}/> TRIBE tokens (currently <strong>{_.round(this.state.stakerUnclaimedTribe / 1e18, 2)}</strong> unclaimed), but they are only compounded to <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens every few days/weeks (depending on how many people are pooled in the CompoundingStaker).</p>
          <p className="mb-0">Last <code>harvest()</code> calls:</p>
          <ul>
            { this.state.pastHarvests.map((tx, i) => <li key={i}>
              <a href={'https://etherscan.io/tx/' + tx.hash} target="_blank" className="text-monospace">{tx.hash.substring(0, 6)}</a> {new Date(tx.timestamp).toString()}
            </li>)}
          </ul>
          { (getAccount() === '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148' || window.location.href.indexOf('localhost') !== -1) ? <p>
            <button onClick={()=>this.stakerHarvest()} className="btn">
              📈 Harvest
            </button>
          </p> : null }
        </div>
        <div className="mb-3">
          <h2>Step 4 : Profit</h2>
            <div className="balance">
              <div>Input of this step currently in your wallet:</div>
              <ul className="mb-0">
                <li><img src={stakerShareImg}/><strong>{_.round(this.state.stakerTokens / 1e18, 2)}</strong> Compounding Staker Shares</li>
              </ul>
              <div>Output of this step currently in your wallet:</div>
              <ul>
                <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 LP tokens</li>
              </ul>
            </div>
            { this.state.stakerTokens > 0 ? <p className="info">
              Your <strong>{_.round(this.state.stakerTokens / 1e18, 2)}</strong> <img src={stakerShareImg}/> Compounding Staker Shares
              are currently worth <strong>{_.round(this.state.stakerTokens/this.state.stakerTokensTotalSupply*this.state.stakerStaked/1e18, 2)}</strong> <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 tokens
              ≈ <strong>{BigNumber(this.state.stakerTokens * (this.state.stakerStaked / this.state.stakerTokensTotalSupply) * 2 * this.state.reserves[0] / this.state.lpTokensTotalSupply / 1e18).toFormat(0)}</strong> <img src={feiImg}/> FEI.
            </p> : null }
            <p>
              Withdraw FEI-TRIBE Uniswap V2 tokens from CompoundingStaker : <a href="javascript:void(0)" onClick={()=>this.withdrawMaxLp()}>max</a>
            </p>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <span className="input-group-text prefix">
                  <img src={stakerShareImg}/>
                </span>
              </div>

              <input type="text" placeholder="0.0" className="form-control" value={this.state.form.staker.stTokens} onChange={(e)=>this.onStTokensChange(e.target.value)} />
            </div>
            <div className="mb-2">
              <button onClick={()=>this.stakerWithdraw()} disabled={this.state.form.staker.stTokens <= 1e-10 ? 'disabled' : null} className="btn">
                💸 Withdraw LP tokens from CompoundingStaker
              </button>
            </div>
        </div>
        <div className="mb-3">
          <h2>Step 5 : Redeem LP tokens for FEI and TRIBE on Uniswap-v2</h2>
          <p>
            You can also do this step <a target="_blank" href="https://app.uniswap.org/#/remove/v2/0x956f47f50a910163d8bf957cf5846d573e7f87ca/0xc7283b66eb1eb5fb86327f08e1b5816b0720212b">
              on the Uniswap interface
            </a>.
          </p>
          <div className="balance">
            <div>Input of this step currently in your wallet:</div>
            <ul className="mb-0">
              <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 LP tokens</li>
            </ul>
            <div>Output of this step currently in your wallet:</div>
            <ul>
              <li><img src={feiImg}/><strong>{_.round(this.state.fei / 1e18, 2)}</strong> FEI</li>
              <li><img src={tribeImg}/><strong>{_.round(this.state.tribe / 1e18, 2)}</strong> TRIBE</li>
            </ul>
          </div>
          <p>
            Remove liquidity from Uniswap to get back your FEI and TRIBE tokens : <a href="javascript:void(0)" onClick={()=>this.depositMaxLp()}>max</a>
          </p>
          <div>
            <div className="input-group mb-2">
              <div className="input-group-prepend">
                <span className="input-group-text prefix">
                  <img src={feiTribeImg}/>
                </span>
              </div>

              <input type="text" placeholder="0.0" className="form-control" value={this.state.form.staker.lpTokens} onChange={(e)=>this.onLpTokensChange()} />
            </div>
            <div className="mb-2">
              { (this.state.form.staker.lpTokens * 1e18 > this.state.lpAllowanceUni * 1) ? <div className="mb-3">
                <button onClick={()=>this.allowLpOnUniswap()} className="btn mr-2">
                  🔓 Allow LP Tokens on Uniswap-v2
                </button>
              </div> : null }
              { (this.state.form.staker.lpTokens * 1e18 <= this.state.lpAllowanceUni * 1) ? <div className="mb-3">
                <button onClick={()=>this.uniswapRemoveLiquidity()} disabled={this.state.form.staker.lpTokens <= 1e-10 ? 'disabled' : null} className="btn">
                  🦄 Remove liquidity from Uniswap-v2
                </button>
              </div> : null }
            </div>
          </div>
        </div>
        { (this.state.account === null) ? <div className="overlay">
          <p>🔓</p>
          <p>Unlock wallet to continue</p>
          <Wallet />
        </div> : null }
        { (this.state.account !== null && this.state.loading) ? <div className="overlay">
          ⏳<br/>
          Loading your account data<br/>
          <div className="progress mt-3">
            <div className="progress-bar" role="progressbar" style={{'width':_.round(this.state.progress * 100)+'%'}}></div>
          </div>
        </div> : null }
      </div>
    );
  }
}

export default CompoundingStakerDeposit;
