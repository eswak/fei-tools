import React, { Component } from 'react';
import './deposit.css';
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

const tribeRewardsAddress = '0x18305DaAe09Ea2F4D51fAa33318be5978D251aBd';
const feiTokenAddress = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';
const tribeTokenAddress = '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B';
const compoundingStakerContractAddress = '0xCe5Dca1a670C558045582e11fa95Fb4433ff2f61';
const feiTribeUniV2PairAddress = '0x9928e4046d7c6513326cCeA028cD3e7a91c7590A';
const uniRouterV2Address = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';

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
      account: null,
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
      stakerTokens: null,
      stakerUnclaimedTribe: null,
      stakerTokensTotalSupply: null,
      stakerStaked: null,
      reserves: [null, null] // fei, tribe
    };
  }

  async componentDidMount() {
    intervalRefresh = setInterval(async () => {
      this.state.account = getAccount();
      this.state.fei = (await Fei.balanceOf(getAccount())).toString();
      this.state.tribe = (await Tribe.balanceOf(getAccount())).toString();
      this.state.feiAllowanceUni = (await Fei.allowance(getAccount(), uniRouterV2Address)).toString();
      this.state.tribeAllowanceUni = (await Tribe.allowance(getAccount(), uniRouterV2Address)).toString();
      this.state.lpAllowanceUni = (await FeiTribeUniV2Pair.allowance(getAccount(), uniRouterV2Address)).toString();
      this.state.lpTokensAllowanceStaker = (await FeiTribeUniV2Pair.allowance(getAccount(), compoundingStakerContractAddress)).toString();
      this.state.lpTokens = (await FeiTribeUniV2Pair.balanceOf(getAccount())).toString();
      this.state.stakerTokens = (await CompoundingStaker.balanceOf(getAccount())).toString();
      this.state.stakerUnclaimedTribe = (await TribeRewards.earned(compoundingStakerContractAddress)).toString();
      this.state.stakerTokensTotalSupply = (await CompoundingStaker.totalSupply()).toString();
      this.state.stakerStaked = (await CompoundingStaker.staked()).toString();
      const reserves = await FeiTribeUniV2Pair.getReserves();
      this.state.reserves[0] = reserves[0].toString();
      this.state.reserves[1] = reserves[1].toString();
      this.setState(this.state);
      this.forceUpdate();
    }, 5000);

    this.state.currentTribeAPR = await this.currentTribeAPR();
    this.setState(this.state);
  }

  componentWillUnmount() {
    clearInterval(intervalRefresh);
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
    const tx = await Fei.approve(uniRouterV2Address, ethers.constants.MaxUint256);
    EventEmitter.dispatch('tx', {
      label: 'Allow FEI on Uniswap',
      hash: tx.hash
    });
  }

  async allowTribeOnUniswap() {
    const tx = await Tribe.approve(uniRouterV2Address, ethers.constants.MaxUint256);
    EventEmitter.dispatch('tx', {
      label: 'Allow TRIBE on Uniswap',
      hash: tx.hash
    });
  }

  async allowLpOnUniswap() {
    const tx = await FeiTribeUniV2Pair.approve(uniRouterV2Address, ethers.constants.MaxUint256);
    EventEmitter.dispatch('tx', {
      label: 'Allow LP-Tokens on Uniswap',
      hash: tx.hash
    });
  }

  async allowLpTokensOnStaker() {
    const tx = await FeiTribeUniV2Pair.approve(compoundingStakerContractAddress, ethers.constants.MaxUint256);
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
      <div className="compounding-staker-deposit">
        <h1 className="mb-3">CompoundingStaker</h1>
        <div className="mb-3 info">
          <h2>Step 0 : Understand what this is about</h2>
          <p>Fei Protocol has an active <a href="https://app.fei.money/stake" target="_blank">Liquidity mining</a> program, where you can earn <img src={tribeImg}/> TRIBE tokens if you stake <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens.</p>
          <p>If you just earn <img src={tribeImg}/> TRIBE and keep them, you will earn <img src={tribeImg}/> TRIBE tokens <strong>linearly</strong> over time (good!). But if you regularly sell some of your earnt <img src={tribeImg}/> TRIBE to get <img src={feiImg}/> FEI, then use them to provide liquidity on Uniswap V2, and stake these additional <img src={feiTribeImg}/> FEI-TRIBE Uniswap LP tokens, you will earn <strong>exponentially</strong> more rewards (better!).</p>
          <p>Over the course of 1 year, I estimate <strong>you will earn ~60% more</strong> if you regularly compound your rewards. But compounding rewards costs a lot of gas, so it is not very convenient to do regularly if you are alone.</p>
          <p>I made this tool so we can pool together and share the cost of compounding.</p>
          <p>The current <img src={tribeImg}/> TRIBE rewards are <strong>{_.round(this.state.currentTribeAPR*100, 2)}% APR</strong>, but with compounding, we could earn <strong>{_.round((1+(this.state.currentTribeAPR*0.95)/52)**52*100, 2)}% APR</strong> ! The <img src={tribeImg}/> TRIBE rewards are decreasing over time, so over the course of 1 year, we will earn less than that. But it shows you how powerful compounding can be.</p>
          <p>The CompoundingStaker works similarly to Pickle jars and Yearn Vaults, but with a much lower fee. These platforms usually keep 10-20% of the rewards for their DAO, and have deposit/withdraw fees. The CompoundingStaker has a 5% fee on <img src={tribeImg}/> TRIBE rewards collected (to cover gas costs) and no deposit/withdraw fees.</p>
          <p>When you deposit <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens, you will get <img src={stakerShareImg}/> CompoundingStaker shares. Over time, when the rewards are compounded, your <img src={stakerShareImg}/> CompoundingStaker shares will be worth more and more <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens. So when you withdraw, you will get more <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens than what you originally deposited, and these tokens will be worth more than what you would have got if you just claimed the <img src={tribeImg}/> TRIBE rewards by yourself.</p>
          <p>The code of the CompoundingStaker is very minimal (<a href="https://etherscan.io/address/eswak.eth" target="_blank">150 lines of code</a>), with bits from Pickle's <a href="https://github.com/pickle-finance/protocol/blob/master/src/pickle-jar.sol" target="_blank">jar</a>/<a href="https://github.com/pickle-finance/protocol/blob/master/src/strategies/strategy-fei-farm-base.sol" target="_blank">strategy</a> and Fei Protocol's <a href="https://github.com/fei-protocol/fei-protocol-core/pull/100" target="_blank">PCVSwapperUniswap</a>, both audited projects. But <strong className="danger">the code of the CompoundingStaker is not audited</strong>. If enough people pool with me, I will use the 5% fee on <img src={tribeImg}/> TRIBE rewards to pay an audit, for the peace of mind.</p>
        </div>
        <div className="mb-3">
          <h2>Step 1 : Get LP tokens by providing liquidity on Uniswap-v2</h2>
          <p>
            You can also do this step <a target="_blank" href="https://app.uniswap.org/#/add/v2/0x956f47f50a910163d8bf957cf5846d573e7f87ca/0xc7283b66eb1eb5fb86327f08e1b5816b0720212b">
              on the Uniswap interface
            </a>.
          </p>
          <div className="balance">
            <div>You currently have :</div>
            <ul>
              <li><img src={feiImg}/><strong>{_.round(this.state.fei / 1e18, 2)}</strong> FEI</li>
              <li><img src={tribeImg}/><strong>{_.round(this.state.tribe / 1e18, 2)}</strong> TRIBE</li>
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
            The CompoundingStaker is deployed at <a href={'https://etherscan.io/address/' + compoundingStakerContractAddress} target="_blank">{compoundingStakerContractAddress}</a> and currently manages <strong>{this.state.stakerStaked}</strong> <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 LP tokens.
          </p>
          <div className="balance">
            <div>You currently have :</div>
            <ul>
              <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 LP tokens</li>
              <li><img src={stakerShareImg}/><strong>{_.round(this.state.stakerTokens / 1e18, 2)}</strong> CompoundingStaker shares</li>
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
          { (getAccount() === '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148' || window.location.href.indexOf('localhost') !== -1) ? <p>
            <button onClick={()=>this.stakerHarvest()} className="btn">
              📈 Harvest
            </button>
          </p> : null }
        </div>
        <div className="mb-3">
          <h2>Step 4 : Profit</h2>
            <div className="balance">
              <div>You currently have :</div>
              <ul>
                <li>
                  <img src={stakerShareImg}/><strong>{_.round(this.state.stakerTokens / 1e18, 2)}</strong> CompoundingStaker shares
                </li>
                <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 tokens</li>
              </ul>
            </div>
            { this.state.stakerTokens > 0 ? <p className="info">
              Your <strong>{_.round(this.state.stakerTokens / 1e18, 2)}</strong> <img src={stakerShareImg}/> CompoundingStaker shares
              are currently worth <strong>{_.round(this.state.stakerTokens/this.state.stakerTokensTotalSupply*this.state.stakerStaked/1e18, 2)}</strong> <img src={feiTribeImg}/> FEI-TRIBE Uniswap V2 tokens.
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
            <div>You currently have :</div>
            <ul>
              <li><img style={{'marginLeft':'-5px'}} src={feiTribeImg}/><strong>{_.round(this.state.lpTokens / 1e18, 2)}</strong> FEI-TRIBE Uniswap V2 LP tokens</li>
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
      </div>
    );
  }
}

export default CompoundingStakerDeposit;
