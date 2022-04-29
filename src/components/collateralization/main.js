import React, { Component } from 'react';
import { ethers } from 'ethers';
import CollateralizationOracleAbi from '../../abi/CollateralizationOracle.json';
import IERC20Abi from '../../abi/IERC20.json';
import IOracleAbi from '../../abi/IOracle.json';
import IPCVDepositAbi from '../../abi/IPCVDeposit.json';
import FixedPricePSMAbi from '../../abi/FixedPricePSM.json';
import { getProvider, getSigner, getAccount } from '../wallet/wallet';
import $ from 'jquery';
import './main.css';
import imgAgeur from './img/ageur.png';
import imgBal from './img/bal.png';
import imgCream from './img/cream.jpg';
import imgd3 from './img/d3.jpg';
import imgFei from './img/fei.png';
import imgEth from './img/eth.png';
import imgLusd from './img/lusd.png';
import imgDai from './img/dai.jpg';
import imgDpi from './img/dpi.jpg';
import imgUsd from './img/usd.jpg';
import imgRai from './img/rai.jpg';
import imgSteth from './img/wsteth.jpg';
import label from '../../modules/label';

const collateralizationOracle = '0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257';
const fei = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';

const $getJSON = (url) => {
  return new Promise((resolve) => {
    $.getJSON(url, resolve);
  });
}

function ERC20(address) {
  return new ethers.Contract(
    address,
    IERC20Abi,
    getProvider()
  );
}
function IPCVDeposit(address) {
  return new ethers.Contract(
    address,
    IPCVDepositAbi,
    getProvider()
  );
}
var CollateralizationOracle = new ethers.Contract(
  collateralizationOracle,
  CollateralizationOracleAbi,
  getProvider()
);
var Fei = new ethers.Contract(
  fei,
  IERC20Abi,
  getProvider()
);

class c extends Component {
  constructor(props) {
    super(props);
    this.state = {
      getTokensInPcv: [],
      getDepositsForToken: {},
      tokenToOracle: {}
    };
  }

  getTokenImage(symbol, depositAddress) {
    if (depositAddress === '0x5ae217dE26f6Ff5F481C6e10ec48b2cf2fc857C8') return <img className="token" src={imgd3}></img>;
    if (depositAddress === '0x24F663c69Cd4B263cf5685A49013Ff5f1C898D24') return <img className="token" src={imgd3}></img>;
    if (depositAddress === '0xA271fF86426c7fdAaAE72603e6Ce68c892d69ED7') return <img className="token" src={imgSteth}></img>;
    if (symbol === 'FEI') return <img className="token" src={imgFei} title="FEI"></img>;
    if (symbol === 'agEUR') return <img className="token" src={imgAgeur} title="agEUR"></img>;
    if (symbol === 'BAL') return <img className="token" src={imgBal} title="BAL"></img>;
    if (symbol === 'CREAM') return <img className="token" src={imgCream} title="CREAM"></img>;
    if (symbol === 'ETH') return <img className="token" src={imgEth} title="ETH"></img>;
    if (symbol === 'WETH') return <img className="token" src={imgEth} title="WETH"></img>;
    if (symbol === 'LUSD') return <img className="token" src={imgLusd} title="LUSD"></img>;
    if (symbol === 'DAI') return <img className="token" src={imgDai} title="DAI"></img>;
    if (symbol === 'DPI') return <img className="token" src={imgDpi} title="DPI"></img>;
    if (symbol === 'USD') return <img className="token" src={imgUsd} title="USD"></img>;
    if (symbol === 'RAI') return <img className="token" src={imgRai} title="RAI"></img>;
    return symbol;
  }

  async componentWillMount() {
    await this.refreshData();
  }

  /*componentWillUnmount() {
    clearInterval(intervalRefresh);
    clearTimeout(setProgressTimeout);
  }*/

  async refreshData() {
    // fetch Coingecko data
    const cgko = (await $getJSON('https://api.coingecko.com/api/v3/simple/price?ids=angle-protocol,balancer,curve-dao-token,tribe-2,convex-finance,tokemak,aave,compound-governance-token,liquity&vs_currencies=usd'));
    this.state.cgko = {};
    this.state.cgko['AAVE'] = cgko['aave'].usd;
    this.state.cgko['ANGLE'] = cgko['angle-protocol'].usd;
    this.state.cgko['BAL'] = cgko['balancer'].usd;
    this.state.cgko['COMP'] = cgko['compound-governance-token'].usd;
    this.state.cgko['CVX'] = cgko['convex-finance'].usd;
    this.state.cgko['CRV'] = cgko['curve-dao-token'].usd;
    this.state.cgko['LQTY'] = cgko['liquity'].usd;
    this.state.cgko['TOKE'] = cgko['tokemak'].usd;
    this.state.cgko['TRIBE'] = cgko['tribe-2'].usd;

    // read CR oracle
    this.state.getTokensInPcv = await CollateralizationOracle.getTokensInPcv();
    for (var i = 0; i < this.state.getTokensInPcv.length; i++) {
      var tokenAddress = this.state.getTokensInPcv[i];
      this.state.getDepositsForToken[tokenAddress] = await CollateralizationOracle.getDepositsForToken(tokenAddress);
    }
    for (var i = 0; i < this.state.getTokensInPcv.length; i++) {
      var tokenAddress = this.state.getTokensInPcv[i];
      this.state.tokenToOracle[tokenAddress] = await CollateralizationOracle.tokenToOracle(tokenAddress);
    }
    this.state.tokens = {};
    for (var i = 0; i < this.state.getTokensInPcv.length; i++) {
      var tokenAddress = this.state.getTokensInPcv[i];
      var oracle = new ethers.Contract(
        this.state.tokenToOracle[tokenAddress],
        IOracleAbi,
        getProvider()
      );
      
      this.state.tokens[tokenAddress] = {
        symbol: await this.getTokenSymbol(tokenAddress),
        value: (await oracle.read())[0].toString() / 1e18
      };
    }
    this.state.deposits = [];
    for (var i = 0; i < this.state.getTokensInPcv.length; i++) {
      var tokenAddress = this.state.getTokensInPcv[i];
      for (var j = 0; j < this.state.getDepositsForToken[tokenAddress].length; j++) {
        var depositAddress = this.state.getDepositsForToken[tokenAddress][j];
        var deposit = new ethers.Contract(
          depositAddress,
          IPCVDepositAbi,
          getProvider()
        );
        var resistantBalanceAndFei = await deposit.resistantBalanceAndFei();
        var balance = resistantBalanceAndFei[0].toString() / 1e18;
        var balanceUSD = balance * this.state.tokens[tokenAddress].value;
        var fei = resistantBalanceAndFei[1].toString() / 1e18;
        this.state.deposits.push({
          address: depositAddress,
          label: await label(depositAddress),
          description: await this.getDepositDescription(depositAddress),
          protocol: await this.getDepositProtocol(depositAddress),
          token: this.state.tokens[tokenAddress].symbol,
          balance: balance,
          balanceUSD: balanceUSD,
          fei: fei,
          pl: await this.getDepositPL(depositAddress, this.state.tokens[tokenAddress].value, balance, balanceUSD, fei)
        });
      }
    }

    // Compute global stats
    this.state.pcv = this.state.deposits.reduce(function(acc, cur) {
      acc += cur.balanceUSD;
      return acc;
    }, 0);
    this.state.totalFei = (await Fei.totalSupply()).toString() / 1e18;
    this.state.protocolFei = this.state.deposits.reduce(function(acc, cur) {
      acc += cur.fei;
      return acc;
    }, 0);
    this.state.circulatingFei = this.state.totalFei - this.state.protocolFei;
    this.state.equity = this.state.pcv - this.state.circulatingFei;
    this.state.pl = this.state.deposits.reduce(function(acc, cur) {
      acc += cur.pl;
      return acc;
    }, 0);

    // compute aggregates
    // PCV assets
    var pcvMap = this.state.deposits.reduce(function(acc, cur) {
      // [sum, sumUSD]
      if (cur.token === 'FEI') return acc;
      acc[cur.token] = acc[cur.token] || [0, 0];
      acc[cur.token][0] += cur.balance;
      acc[cur.token][1] += cur.balanceUSD;
      return acc;
    }, {});
    this.state.pcvComposition = [];
    for (var key in pcvMap) {
      this.state.pcvComposition.push({
        token: key,
        balance: pcvMap[key][0],
        balanceUSD: pcvMap[key][1]
      });
    }
    this.state.pcvComposition.sort((a, b) => a.balanceUSD < b.balanceUSD ? 1 :-1);

    // persist an history in localStorage
    var comp = JSON.parse(localStorage.getItem('comp') || '{}');
    var today = new Date().toISOString().split('T')[0];
    comp[today] = comp[today] || this.state.pcvComposition.reduce((acc, cur) => {
      acc[cur.token] = [cur.balance, cur.balanceUSD/cur.balance];
      return acc;
    }, {});
    localStorage.setItem('comp', JSON.stringify(comp));

    // Protocols
    var protocolsMap = this.state.deposits.reduce(function(acc, cur) {
      acc[cur.protocol] = acc[cur.protocol] || 0;
      acc[cur.protocol] += cur.balanceUSD + cur.fei;
      return acc;
    }, {});
    this.state.pcvProtocols = [];
    for (var key in protocolsMap) {
      this.state.pcvProtocols.push({
        protocol: key || 'Uncategorized',
        balanceUSD: protocolsMap[key]
      });
    }
    this.state.pcvProtocols.sort((a, b) => a.balanceUSD < b.balanceUSD ? 1 :-1);

    // TRIBE
    var tribe = ERC20('0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B');
    this.state.tribeTotalSupply = (await tribe.totalSupply()).toString() / 1e18;
    this.state.tribeInTreasury = (await tribe.balanceOf('0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9')).toString() / 1e18;
    this.state.tribeCirculating = this.state.tribeTotalSupply - this.state.tribeInTreasury;
    this.state.yearsSinceGenesis = (Date.now() - new Date('2021-04-01').getTime())/(365*24*36e5);
    this.state.tribeSpeculativePremium = this.state.cgko['TRIBE'] - this.state.equity / this.state.tribeCirculating;

    // sort deposits
    //this.state.deposits.sort(function(a,b) { return a.label > b.label ? 1 : -1 });
    this.state.deposits.sort(function(a,b) { return (a.balanceUSD + a.fei) < (b.balanceUSD + b.fei) ? 1 : -1 });

    // set state & redraw
    this.setState(this.state);
    this.forceUpdate();

    // make the data available in console & print
    window.state = this.state;
    console.log('window.state', window.state);
  }

  async getTokenSymbol(address) {
    if (address == '0x1111111111111111111111111111111111111111') return 'USD';
    if (address == '0x956F47F50A910163D8BF957Cf5846D573E7f87CA') return 'FEI';
    if (address == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') return 'WETH';
    if (address == '0x6B175474E89094C44Da98b954EedeAC495271d0F') return 'DAI';
    if (address == '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0') return 'LUSD';
    if (address == '0xba100000625a3754423978a60c9317c58a424e3D') return 'BAL';
    if (address == '0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8') return 'agEUR';
    if (address == '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919') return 'RAI';
    var token = new ethers.Contract(
      address,
      IERC20Abi,
      getProvider()
    );
    return await token.symbol();
  }

  async getDepositDescription(address) {
    if (address == '0x24F663c69Cd4B263cf5685A49013Ff5f1C898D24') return 'This is usually empty, as D3pool LP tokens are moved to the Convex deposit most of the time (to earn CRV and CVX rewards).';
    if (address == '0x06dAcca04e201AD31393754E68dA04Dc14778Fa6') return 'This PCV Deposit is used to account a fixed $ value for some assets that are not very liquid or don\'t have a reliable on-chain oracle (like INDEX), and FEI deployments that don\'t have a fixed contract address (like Ondo LaaS).';
    if (address == '0x7Eb88140af813294aEDce981b6aC08fcd139d408') return 'Optimistic Approval is a community-owned multisig that can queue some governance actions on the Optimistic Approval Timelock to be executed after 4 days of delay (instead of going for a full on-chain vote).';
    if (address == '0xec54148CbC47bFF8FCc5e04e5E8083aDb8aF9aD9') return 'Float Protocol\'s Fuse pool was hacked due to a Uni-v3 Oracle manipulation.';
    if (address == '0x5ae217dE26f6Ff5F481C6e10ec48b2cf2fc857C8') return 'Stake LP tokens in Convex & earn CRV & CVX rewards.';
    if (address == '0x0961d2a545e0c1201B313d14C57023682a546b9D') return 'Deposit tokens in reactor & earn TOKE rewards.';
    if (address == '0x0735e14D28eD395048d5Fa4a8dbe6e6EB9fc0470') return 'Deposit tokens in lending market & earn interests + COMP rewards.';
    if (address == '0xfDe7077AAEcDaf2C4B85261Aa858c96A7E737a61') return 'Deposit tokens in lending market & earn interests + COMP rewards.';
    if (address == '0xB80B3dc4F8B30589477b2bA0e4EF2b8224bDf0a5') return 'Deposit tokens in lending market & earn interests.';
    if (address == '0x43Ef03755991056681F01EE2182234eF6aF1f658') return 'Deposit tokens in lending market & earn interests + stkAAVE rewards.';
    if (address == '0x1267B39c93711Dd374DEAB15e0127e4adB259BE0') return 'Deposit tokens in lending market & earn interests + stkAAVE rewards.';
    if (address == '0xFAc571b6054619053ac311dA8112939C9a374A85') return 'Deposit tokens in lending market & earn interests.';
    if (address == '0x98E5F5706897074a4664DD3a32eB80242d6E694B') return 'The Peg Stability Modules are used to defend a 1$ peg for FEI by allowing users to mint new FEI by providing assets, or redeem FEI for assets.';
    if (address == '0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2') return 'The Peg Stability Modules are used to defend a 1$ peg for FEI by allowing users to mint new FEI by providing assets, or redeem FEI for assets.';
    if (address == '0xb0e731F036AdfDeC12da77c15aaB0F90E8e45A0e') return 'The Peg Stability Modules are used to defend a 1$ peg for FEI by allowing users to mint new FEI by providing assets, or redeem FEI for assets.';
    if (address == '0x3a1838Ac9EcA864054bebB82C32455Dd7d7Fc89c') return 'The C.R.E.A.M. markets got hacked by an Oracle manipulation attack. The protocol lost the 5M FEI deposited in CREAM, and got these CREAM tokens in compensation for the hack.';
    if (address == '0x89DfBC12001b41985eFAbd7dFCae6a77B22E4Ec3') return 'The protocol can mint new FEI to buyback TRIBE on the open market using a Balancer LBP that lasts one week.';
    if (address == '0x2c47Fef515d2C70F2427706999E158533F7cF090') return 'Turbo is a Tribe DAO product that allows other DAOs to mint FEI into approved ERC4626 strategies, turning their idle governance tokens into productive assets.';
    if (address == '0xE8633C49AcE655EB4A8B720e6b12F09Bd3a97812') return 'This is usually empty, as LP tokens are moved to the Angle Protocol\'s gauges to earn ANGLE rewards.';
    if (address == '0xc5bb8F0253776beC6FF450c2B40f092f7e7f5b57') return 'This is usually empty, as LP tokens are moved to Balancer\'s gauges to earn BAL rewards.';
    if (address == '0xcd1Ac0014E2ebd972f40f24dF1694e6F528B2fD4') return 'This is usually empty, as B-80BAL-20WETH are vote-locked to veBAL.';
    return '';
  }

  async getDepositProtocol(address) {
    if (address == '0x5ae217dE26f6Ff5F481C6e10ec48b2cf2fc857C8') return 'Convex';
    if (address == '0x24F663c69Cd4B263cf5685A49013Ff5f1C898D24') return 'Curve';
    if (address == '0x0961d2a545e0c1201B313d14C57023682a546b9D') return 'Tokemak';
    if (address == '0xA271fF86426c7fdAaAE72603e6Ce68c892d69ED7') return 'Lido';
    if (address == '0x0735e14D28eD395048d5Fa4a8dbe6e6EB9fc0470') return 'Compound';
    if (address == '0x43Ef03755991056681F01EE2182234eF6aF1f658') return 'Aave';
    if (address == '0x15958381E9E6dc98bD49655e36f524D2203a28bD') return 'Uniswap v2';
    if (address == '0xE8633C49AcE655EB4A8B720e6b12F09Bd3a97812') return 'Uniswap v2';
    if (address == '0xD6598a23418c7FEf7c0Dc863265515B623B720F9') return 'Fuse';
    if (address == '0x9CC46aB5A714f7cd24C59f33C5769039B5872491') return 'Fuse';
    if (address == '0xec54148CbC47bFF8FCc5e04e5E8083aDb8aF9aD9') return 'Fuse';
    if (address == '0xb3A026B830796E43bfC8b135553A7573538aB341') return 'Fuse';
    if (address == '0x7aA4b1558C3e219cFFFd6a356421C071F71966e7') return 'Fuse';
    if (address == '0xC68412B72e68c30D4E6c0854b439CBBe957146e4') return 'Fuse';
    if (address == '0x9a774a1B1208C323EDeD05E6Daf592E6E59cAa55') return 'Fuse';
    if (address == '0xfDe7077AAEcDaf2C4B85261Aa858c96A7E737a61') return 'Compound';
    if (address == '0x508f6fbd78B6569C29E9D75986a51558dE9E5865') return 'Fuse';
    if (address == '0xB4FFD10C4C290Dc13E8e30BF186F1509001515fD') return 'Fuse';
    if (address == '0xCCe230c087F31032fc17621a2CF5E425A0b80C96') return 'Fuse';
    if (address == '0x7e39bBA9D0d967Ee55524fAe9e54900B02d9889a') return 'Fuse';
    if (address == '0xe2e35097638F0Ff2EeCA2EF70F352Be37431945f') return 'Fuse';
    if (address == '0x07F2DD7E6A78D96c08D0a8212f4097dCC129d629') return 'Fuse';
    if (address == '0x05E2e93CFb0B53D36A3151ee727Bb581D4B918Ce') return 'Fuse';
    if (address == '0xA62ddde8F799873E6FcdbB3aCBbA75da85D9dcdE') return 'Fuse';
    if (address == '0xa2BdbCb95d31C85BAE6f0FA42D55F65d609D94eE') return 'Fuse';
    if (address == '0x395B1Bc1800fa0ad48ae3876E66d4C10d297650c') return 'Fuse';
    if (address == '0x1370CA8655C255948d6c6110066d78680601B7c2') return 'Fuse';
    if (address == '0x1267B39c93711Dd374DEAB15e0127e4adB259BE0') return 'Aave';
    if (address == '0xc5bb8F0253776beC6FF450c2B40f092f7e7f5b57') return 'Balancer';
    if (address == '0xFAc571b6054619053ac311dA8112939C9a374A85') return 'Aave';
    if (address == '0xB80B3dc4F8B30589477b2bA0e4EF2b8224bDf0a5') return 'Compound';
    if (address == '0xcd1Ac0014E2ebd972f40f24dF1694e6F528B2fD4') return 'Balancer';
    if (address == '0x89DfBC12001b41985eFAbd7dFCae6a77B22E4Ec3') return 'Balancer';
    if (address == '0x2c47Fef515d2C70F2427706999E158533F7cF090') return 'Turbo';
    if (address == '0x8C51E4532CC745cF3DFec5CEBd835D07E7BA1002') return 'Fuse';
    if (address == '0x6026a1559CDd44a63C5CA9A078CC996a9eb68ABB') return 'Fuse';
    if (address == '0x374628EBE7Ef6AcA0574e750B618097531A26Ff8') return 'B.Protocol';
    if (address == '0xF846eE6E8EE9A6fbf51c7c65105CAbc041c048ad') return 'Fuse';
    if (address == '0xD2554839c2e8a87Dd2CddD013EF828B6534aBC26') return 'Angle';
    if (address == '0xb31F75550e97A2C4c7AC8d4355032B8AE8b9584D') return 'Balancer';
    if (address == '0xD8Eb546726d449fC1dEd06DFeCa800A2fa8bB930') return 'Balancer';
    if (address == '0x8cbA3149b95084A61bBAb9e01110b0fB92C9a289') return 'Balancer';
    if (address == '0x3a1838Ac9EcA864054bebB82C32455Dd7d7Fc89c') return 'Fei';
    if (address == '0xB250926E75b1CC6c53E77bb9426Baac14aB1e24c') return 'Fei';
    if (address == '0x485d23ce5725ecdE46ca9033012984D90b514FFd') return 'Fei';
    if (address == '0x7339cA4Ac94020b83A34f5edFA6e0F26986c434b') return 'Fei';
    if (address == '0x5E9fA7d783A7F7d4626cE450C8Bd2EbBB26dfdB2') return 'Fei';
    if (address == '0x7Eb88140af813294aEDce981b6aC08fcd139d408') return 'Fei';
    if (address == '0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2') return 'Fei';
    if (address == '0x98E5F5706897074a4664DD3a32eB80242d6E694B') return 'Fei';
    if (address == '0xb0e731F036AdfDeC12da77c15aaB0F90E8e45A0e') return 'Fei';
    return '';
  }

  async getDepositPL(address, tokenValue, balance, balanceUSD, protocolFei) {
    // Float Protocol Fuse pool 90 hack
    if (address == '0xec54148CbC47bFF8FCc5e04e5E8083aDb8aF9aD9') {
      return -balance;
    }
    // Fuse pool 8 (FeiRari) FEI
    if (address == '0xD6598a23418c7FEf7c0Dc863265515B623B720F9') {
      return balance - 20e6;
    }
    // CREAM value minus 5M FEI hack
    if (address == '0x3a1838Ac9EcA864054bebB82C32455Dd7d7Fc89c') {
      return balance * tokenValue - 5e6;
    }
    // BAL/WETH pool
    if (address == '0xcd1Ac0014E2ebd972f40f24dF1694e6F528B2fD4') {
      var currentBalance = (await ERC20('0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56').balanceOf(address)).toString() / 1e18;
      return (currentBalance / 104595.9 - 1) * balanceUSD;
    }
    // Convex CRV & CVX rewards
    if (address == '0x5ae217dE26f6Ff5F481C6e10ec48b2cf2fc857C8') {
      const crv = (await ERC20('0xD533a949740bb3306d119CC777fa900bA034cd52').balanceOf(address)).toString() / 1e18 * this.state.cgko['CRV'];
      const cvx = (await ERC20('0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B').balanceOf(address)).toString() / 1e18 * this.state.cgko['CVX'];
      return crv + cvx;
    }
    // Curve d3pool
    if (address == '0x24F663c69Cd4B263cf5685A49013Ff5f1C898D24') {
      return -96604;
    }
    // Tokemak ETH reactor TOKE rewards
    if (address == '0x0961d2a545e0c1201B313d14C57023682a546b9D') {
      const toke = (await ERC20('0x2e9d63788249371f1DFC918a52f8d799F4a38C94').balanceOf(address)).toString() / 1e18 * this.state.cgko['TOKE'];
      return toke;
    }
    // ANGLE tokens farmed
    if (address == '0xD2554839c2e8a87Dd2CddD013EF828B6534aBC26') {
      return (await IPCVDeposit('0xb91F96b7C62fe4a2301219956Cc023fA7892F0C0').balance()).toString() / 1e18 * this.state.cgko['ANGLE'];
    }
    // Compound ETH
    if (address == '0x0735e14D28eD395048d5Fa4a8dbe6e6EB9fc0470') {
      const unwrappedDeposit = '0x4fCB1435fD42CE7ce7Af3cB2e98289F79d2962b3';
      const interest = (balance - await depositMinusWithdrawals(unwrappedDeposit));
      const comp = (await ERC20('0xc00e94Cb662C3520282E6f5717214004A7f26888').balanceOf(unwrappedDeposit)).toString() / 1e18;
      return interest * tokenValue + comp * this.state.cgko['COMP'];
    }
    // Compound DAI
    if (address == '0xfDe7077AAEcDaf2C4B85261Aa858c96A7E737a61') {
      const unwrappedDeposit = '0xe0f73b8d76D2Ad33492F995af218b03564b8Ce20';
      const interest = (balance - await depositMinusWithdrawals(unwrappedDeposit));
      const comp = (await ERC20('0xc00e94Cb662C3520282E6f5717214004A7f26888').balanceOf(unwrappedDeposit)).toString() / 1e18;
      return interest * tokenValue + comp * this.state.cgko['COMP'];
    }
    // Aave ETH
    if (address == '0x43Ef03755991056681F01EE2182234eF6aF1f658') {
      const unwrappedDeposit = '0x5B86887e171bAE0C2C826e87E34Df8D558C079B9';
      const interest = (balance - await depositMinusWithdrawals(unwrappedDeposit));
      const stkAAVE = (await ERC20('0x4da27a545c0c5B758a6BA100e3a049001de870f5').balanceOf(unwrappedDeposit)).toString() / 1e18;
      return interest * tokenValue + stkAAVE * this.state.cgko['AAVE'];
    }
    // Aave RAI
    if (address == '0x1267B39c93711Dd374DEAB15e0127e4adB259BE0') {
      const unwrappedDeposit = '0xd2174d78637a40448112aa6B30F9B19e6CF9d1F9';
      const interest = (balance - await depositMinusWithdrawals(unwrappedDeposit));
      const stkAAVE = (await ERC20('0x4da27a545c0c5B758a6BA100e3a049001de870f5').balanceOf(unwrappedDeposit)).toString() / 1e18;
      return interest * tokenValue + stkAAVE * this.state.cgko['AAVE'];
    }
    // B-80BAL-20WETH ETH
    if (address == '0xD8Eb546726d449fC1dEd06DFeCa800A2fa8bB930') {
      return (balance - 250) * tokenValue;
    }
    // B-80BAL-20WETH BAL
    if (address == '0x8cbA3149b95084A61bBAb9e01110b0fB92C9a289') {
      return (balance - 200000) * this.state.cgko['BAL'];
    }
    // Liquity B.AMM
    if (address == '0x374628EBE7Ef6AcA0574e750B618097531A26Ff8') {
      const lqty = (await ERC20('0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D').balanceOf(address)).toString() / 1e18;
      return 80e6 - balance + lqty * this.state.cgko['LQTY'];
    }
    // DAI PSM
    if (address == '0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2') {
      var contract = new ethers.Contract(
        address,
        FixedPricePSMAbi,
        getProvider()
      );
      let redeems = await contract.queryFilter(contract.filters.Redeem());
      const redeemProfits = redeems.reduce((acc, cur) => {
        // profit = FEI in - DAI out
        acc += cur.args[1].toString()/1e18 - cur.args[2].toString()/1e18;
        return acc;
      }, 0);
      return redeemProfits;
    }
    // LUSD PSM
    if (address == '0xb0e731F036AdfDeC12da77c15aaB0F90E8e45A0e') {
      var contract = new ethers.Contract(
        address,
        FixedPricePSMAbi,
        getProvider()
      );
      let redeems = await contract.queryFilter(contract.filters.Redeem());
      const redeemProfits = redeems.reduce((acc, cur) => {
        // profit = FEI in - LUSD out
        acc += cur.args[1].toString()/1e18 - cur.args[2].toString()/1e18;
        return acc;
      }, 0);
      return redeemProfits;
    }

    // Default behavior : read sum of deposits/withdrawals & compare to current balance
    const wrapper = {
      '0xA271fF86426c7fdAaAE72603e6Ce68c892d69ED7': '0xAc38Ee05C0204A1E119C625d0a560D6731478880', // stETH Lido
      '0xC68412B72e68c30D4E6c0854b439CBBe957146e4': null, // Fuse 146 ETH
      '0x9CC46aB5A714f7cd24C59f33C5769039B5872491': null, // Fuse 8 DAI
      '0xF846eE6E8EE9A6fbf51c7c65105CAbc041c048ad': null, // Fuse 8 LUSD
      '0xCCe230c087F31032fc17621a2CF5E425A0b80C96': '0x9aAdFfe00eAe6d8e59bB4F7787C6b99388A6960D', // Fuse 9 RAI
      '0xFAc571b6054619053ac311dA8112939C9a374A85': '0xaFBd7Bd91B4c1Dd289EE47a4F030FBeDfa7ABc12', // Aave FEI
      '0xB80B3dc4F8B30589477b2bA0e4EF2b8224bDf0a5': '0xe1F2a7342459b54fBFea9F40695cdD46EFadEEeE', // Compound FEI
      '0x9a774a1B1208C323EDeD05E6Daf592E6E59cAa55': '0x3dD3d945C4253bAc5B4Cc326a001B7d3f9C4DD66', // Fuse 19 DPI
      '0xb3A026B830796E43bfC8b135553A7573538aB341': '0x76dFcf06E7D7B8248094DC319b284fB244f06309', // Fuse 79 FEI
      '0x1370CA8655C255948d6c6110066d78680601B7c2': '0x525eA5983A2e02abA8aA0BE7D15Cd73150812379', // Fuse 156 FEI
      '0xA62ddde8F799873E6FcdbB3aCBbA75da85D9dcdE': '0x02101960B3B317839254a17ba54a811A087cB3A0', // Fuse 128 FEI
      '0x07F2DD7E6A78D96c08D0a8212f4097dCC129d629': '0x5A8CB4556e5D5935Af06beab8292905f48131479', // Fuse 18 FEI
      '0x7e39bBA9D0d967Ee55524fAe9e54900B02d9889a': '0xD6960adba53212bBE96E54a7AFeDA2066437D000', // Fuse 19 FEI
      '0xa2BdbCb95d31C85BAE6f0FA42D55F65d609D94eE': '0x7CeBaB7b4B4399343f6D0D36B550EE097F60d7fE', // Fuse 22 FEI
      '0x508f6fbd78B6569C29E9D75986a51558dE9E5865': '0x1434F99EDB2bD03DECCCFe21288767b8324B7403', // Fuse 24 FEI
      '0xB4FFD10C4C290Dc13E8e30BF186F1509001515fD': '0xe1662531aA5de1DAD8ab5B5756b8F6c8F3C759Ca', // Fuse 25 FEI
      '0xe2e35097638F0Ff2EeCA2EF70F352Be37431945f': '0x91f50E3183a8CC30D2A981C3aFA85A2Bf6691c67', // Fuse 27 FEI
      '0x05E2e93CFb0B53D36A3151ee727Bb581D4B918Ce': '0x81DCB06eA4db474D1506Ca6275Ff7D870bA3A1Be', // Fuse 31 FEI
      '0x7aA4b1558C3e219cFFFd6a356421C071F71966e7': '0xB51f09B6F103D697dc5d64DC904Ad6a2Dad39987', // Fuse 6 FEI
      '0x6026a1559CDd44a63C5CA9A078CC996a9eb68ABB': null, // Fuse 7 FEI
      '0x395B1Bc1800fa0ad48ae3876E66d4C10d297650c': '0x4A5Af5A124E672C156241b76CAd4E41D09dd4883', // Fuse 72 FEI
      '0x8C51E4532CC745cF3DFec5CEBd835D07E7BA1002': null // Fuse 91 LUSD
    };
    if (wrapper[address] !== undefined) {
      const io = await depositMinusWithdrawals(wrapper[address] ? wrapper[address] : address);
      return (balance - io) * (tokenValue || 1);
    }

    return 0;
  }

  render() {
    return (
      <div className="collateralization">
        <div className="card section">
          <h1 className="mb-3">Collateralization Oracle</h1>
          <div className="info">
            <p>This page is a simple web tool that reads the <a href="https://etherscan.io/address/0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257#code" target="_blank">Collateralization Oracle</a> of Fei Protocol, a smart contract that details where all the PCV assets that back the FEI stablecoin are deployed.</p>
            <p>Additional metadata are hard-coded in the front-end, such as the PCV Deposit description, protocol, and rules for revenue calculations. Contract labels are fetched from <a href="https://github.com/fei-protocol/fei-protocol-core/blob/develop/protocol-configuration/mainnetAddresses.ts" target="_blank">Github</a>.</p>
            <p>Revenue calculations are made since PCV deployments, so it has been higher in the recent months (when more strategies existed) than at the protocol genesis.</p>
            <p>Revenue calculations are made only on PCV deployments, and other revenue streams from the DAO (like the <a href="https://metrics.rari.capital/d/NlUs6DwGk/fuse-overview?orgId=1&refresh=5m" target="_blank">~1.9M$ Fuse platform fees</a>) are not accounted here.</p>
            <p><strong>For global stats, scroll below the big table.</strong></p>
          </div>
          { this.state.getTokensInPcv.length == 0 ? <div className="info">
            <hr/>
            <div className="text-center">Reading latest on-chain data (this can take several seconds / a minute)...</div>
          </div> : null }
          { this.state.getTokensInPcv.length != 0 ? <div>
            <table className="mb-3">
              <thead>
                <tr>
                  <th className="text-center">Token</th>
                  <th>PCV Deposit</th>
                  <th className="text-center">Protocol</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Balance (USD)</th>
                  <th className="text-right">Protocol FEI</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                { this.state.deposits.map((deposit, i) => <tr key={i} className={i%2?'odd':'even'}>
                  <td className="text-center">{this.getTokenImage(deposit.token, deposit.address)}</td>
                  <td>
                    <a href={'https://etherscan.io/address/' + deposit.address} target="_blank">
                      {deposit.label}
                    </a>
                    { deposit.description ? <div className="text-muted text-small">{deposit.description}</div> : null }
                  </td>
                  <td className="text-center">{deposit.protocol || '-'}</td>
                  <td className="text-right nowrap">{formatNumber(deposit.balance)}</td>
                  <td className="text-right nowrap">{formatNumber(deposit.balanceUSD, '$ ')}</td>
                  <td className="text-right nowrap">{formatNumber(deposit.fei)}</td>
                  <td className="text-right nowrap">
                    {deposit.pl ? <span className={deposit.pl>0?'positive':'negative'}>
                      {formatNumber(deposit.pl, '$ ')}
                    </span> : '-'}
                  </td>
                </tr>)}
              </tbody>
            </table>
            <table style={{'width':'auto', 'margin': '0 0 1em', 'background':'#eee', 'float': 'left'}}>
              <thead>
                <tr>
                  <th colSpan="2">The FEI Stablecoin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total FEI Supply</td>
                  <td><strong>{formatNumber(this.state.totalFei)}</strong></td>
                </tr>
                <tr>
                  <td>Protocol Controlled FEI</td>
                  <td><strong>{formatNumber(this.state.protocolFei)}</strong></td>
                </tr>
                <tr>
                  <td>User Circulating FEI</td>
                  <td><strong>{formatNumber(this.state.circulatingFei)}</strong></td>
                </tr>
              </tbody>
            </table>
            <table style={{'width':'auto', 'margin': '0 0 1em', 'background':'#eee', 'float': 'left', 'marginLeft': '1em'}}>
              <thead>
                <tr>
                  <th colSpan="3"><strong>Assets in the PCV</strong></th>
                </tr>
              </thead>
              <tbody>
                { this.state.pcvComposition.map((entry, i) => <tr key={i}>
                  <td>{entry.token}</td>
                  <td>{formatNumber(entry.balance)}</td>
                  <td><strong>{formatNumber(entry.balanceUSD, '$ ')}</strong></td>
                </tr>)}
              </tbody>
            </table>
            <table style={{'width':'auto', 'margin': '0 0 1em', 'background':'#eee', 'float': 'left', 'marginLeft': '1em'}}>
              <thead>
                <tr>
                  <th colSpan="2">Protocol FEI and PCV location</th>
                </tr>
              </thead>
              <tbody>
                { this.state.pcvProtocols.map((entry, i) => <tr key={i}>
                  <td>{entry.protocol}</td>
                  <td><strong>{formatNumber(entry.balanceUSD, '$ ')}</strong></td>
                </tr>)}
              </tbody>
            </table>
            <table style={{'width':'auto', 'margin': '0 0 1em', 'background':'#eee', 'float': 'left', 'marginLeft': '1em'}}>
              <thead>
                <tr>
                  <th colSpan="2">TRIBE the asset</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TRIBE Total Supply</td>
                  <td><strong>{formatNumber(this.state.tribeTotalSupply)}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE in DAO Treasury</td>
                  <td><strong>{formatNumber(this.state.tribeInTreasury)}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE Circulating (+ Vesting + LM)</td>
                  <td><strong>{formatNumber(this.state.tribeCirculating)}</strong></td>
                </tr>
                <tr>
                  <td>Protocol Controlled Value</td>
                  <td><strong>{formatNumber(this.state.pcv, '$ ')}</strong></td>
                </tr>
                <tr>
                  <td>Protocol Equity (PCV - Circulating FEI)</td>
                  <td><strong>{formatNumber(this.state.equity, '$ ')}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE Circulating Market Cap</td>
                  <td><strong>{formatNumber(this.state.cgko['TRIBE'] * this.state.tribeCirculating, '$ ')}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE Book Value (Equity / Circ. MCap)</td>
                  <td><strong>$ {Math.round(10000 * this.state.equity / this.state.tribeCirculating)/10000}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE Market Value</td>
                  <td><strong>$ {Math.round(10000 * this.state.cgko['TRIBE'])/10000}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE P/BV</td>
                  <td><strong>{Math.round(100 * (this.state.cgko['TRIBE'] * this.state.tribeCirculating / this.state.equity))/100}</strong></td>
                </tr>
                <tr>
                  <td>PCV Growth since Genesis</td>
                  <td><strong>{formatNumber(this.state.pl, '$ ')}</strong></td>
                </tr>
                <tr>
                  <td>Average PCV Growth per Year</td>
                  <td><strong>{formatNumber(this.state.pl / this.state.yearsSinceGenesis, '$ ')}</strong></td>
                </tr>
                <tr>
                  <td>TRIBE P/E</td>
                  <td><strong>{Math.round(100 * this.state.cgko['TRIBE'] * this.state.tribeCirculating / (this.state.pl / this.state.yearsSinceGenesis))/100}</strong></td>
                </tr>
              </tbody>
            </table>
          </div> : null }
        </div>
      </div>
    );
  }
}

async function depositMinusWithdrawals(address) {
  var contract = IPCVDeposit(address);
  let deposits = await contract.queryFilter(contract.filters.Deposit());
  let withdrawals = await contract.queryFilter(contract.filters.Withdrawal());
  const totalDeposits = deposits.reduce((acc, cur) => {
    acc += cur.args[1].toString()/1e18;
    return acc;
  }, 0);
  const totalWithdrawals = withdrawals.reduce((acc, cur) => {
    acc += cur.args[2].toString()/1e18;
    return acc;
  }, 0);
  return totalDeposits - totalWithdrawals;
}

function formatNumber(x, prefix, suffix) {
  if (!x) return '-';
  const negative = x < 0;
  const number = Math.round(Math.abs(x));
  return (prefix || '') + (negative ? '-' : '') + String(number).replace(/(.)(?=(\d{3})+$)/g,'$1,') + (suffix || '');
  /*x = Number(x);
  let ret = x >= 0 ? '+' : '-'; // red or green
  let absX = Math.abs(x);
  let suffix = '';
  if (absX >= 1e17) {
    // 18 decimals... probably
    absX = absX / 1e18;
    suffix = ' (e18)';
  }
  if (absX > 1e6) {
    // > 1M
    absX = absX / 1e6;
    suffix = ' M' + suffix;
  } else if (absX > 1e3) {
    // > 1k
    absX = absX / 1e3;
    suffix = ' k' + suffix;
  }
  const xRound = Math.round(absX * 100) / 100;
  ret += xRound + suffix;
  return ret;*/
}

export default c;
