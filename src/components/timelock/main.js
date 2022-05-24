import React, { Component } from 'react';
import { Contract, ethers } from 'ethers';
import TimelockAbi from '../../abi/Timelock.json';
import { getProvider, getSigner, getAccount } from '../wallet/wallet';
import $ from 'jquery';
import moment from 'moment';
import './main.css';
import label from '../../modules/label';

const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT');

const $getJSON = (url) => {
  return new Promise((resolve) => {
    $.getJSON(url, resolve);
  });
}

var timelock;
var intervalDraw;

class c extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timelocks: {
        'Optimistic Aproval Timelock': '0xbC9C084a12678ef5B516561df902fdc426d95483',
        'Ops Optimistic Aproval Timelock': '0x7DC26A320a9f70Db617e24B77aCA1D3DC48C5721',
        'Tribal Council Timelock': '0xe0C7DE94395B629860Cbb3c42995F300F56e6d7a'
      },
      timelock: null,
      calls: []
    };
  }

  async componentWillMount() {
    var that = this;
    intervalDraw = setInterval(function() {
      that.setState(that.state);
      that.forceUpdate();
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(intervalDraw);
  }

  async setTimelock(addr) {
    this.state.timelock = addr;
    this.state.minDelay = null;
    this.state.calls = [];
    this.state.roles = {};
    if (addr) {
      timelock = new ethers.Contract(
        addr,
        TimelockAbi,
        provider
      );
      this.state.minDelay = await timelock.getMinDelay();
    }
    this.setState(this.state);
    if (addr) {
      await this.refreshData();
    }
  }

  async refreshData() {
    this.state.calls = [];

    let roleGrantedCalls = await timelock.queryFilter(timelock.filters.RoleGranted());
    let roleRevokedCalls = await timelock.queryFilter(timelock.filters.RoleRevoked());
    var roles = {};
    roleGrantedCalls.forEach(function(call) {
      roles[call.args.role] = roles[call.args.role] || {};
      roles[call.args.role][call.args.account] = true;
    });
    roleRevokedCalls.forEach(function(call) {
      delete roles[call.args.role][call.args.account];
    });
    this.state.roles = roles;
    // add address labels
    for (var role in this.state.roles) {
      for (var address in this.state.roles[role]) {
        this.state.roles[role][address] = await label(address);
      }
    }

    // read timelock events
    // cancelled
    var cancels= [];
    let cancelCalls = await timelock.queryFilter(timelock.filters.Cancelled());
    cancelCalls.forEach(function(call) {
      cancels.push({
        id: call.args.id,
        blockNumber: call.blockNumber,
        transactionHash: call.transactionHash
      });
    });
    // executed
    let executedCalls = await timelock.queryFilter(timelock.filters.CallExecuted());
    console.log('executedCalls', executedCalls);
    for (var i = 0; i < executedCalls.length; i++) {
      var call = executedCalls[i];
      this.state.calls.unshift({
        loading: true,
        getTransaction: call.getTransaction,
        id: call.args.id,
        blockNumber: call.blockNumber,
        blockHash: call.blockHash,
        txHash: call.transactionHash,
        index: call.args.index.toString(),
        target: call.args.target,
        value: call.args.value.toString(),
        data: call.args.data,
        delay: 0
      });
    }
    // queued
    let queuedCalls = await timelock.queryFilter(timelock.filters.CallScheduled());
    console.log('queuedCalls', queuedCalls);
    for (var i = 0; i < queuedCalls.length; i++) {
      var call = queuedCalls[i];
      var found = false;
      for (var j = 0; j < this.state.calls.length; j++) {
        if (this.state.calls[j].id == call.args.id && !this.state.calls[j].delay) found = true;
      }
      if (found) continue;
      this.state.calls.unshift({
        loading: true,
        getTransaction: call.getTransaction,
        id: call.args.id,
        blockNumber: call.blockNumber,
        blockHash: call.blockHash,
        txHash: call.transactionHash,
        index: call.args.index.toString(),
        target: call.args.target,
        value: call.args.value.toString(),
        data: call.args.data,
        delay: call.args.delay.toString() / 1
      });
    }

    this.state.calls = this.state.calls.filter(function(call) {
      var cancelled = false;
      cancels.forEach(function(cancel) {
        if (cancel.id == call.id && cancel.blockNumber > call.blockNumber) {
          cancelled = true;
        }
      });
      return !cancelled;
    });

    for (var i = 0; i < this.state.calls.length; i++) {
      var call = this.state.calls[i];
      var from = (await call.getTransaction()).from;
      delete call['getTransaction'];
      call.executedBy = from;
      call.executedByLabel = await label(call.executedBy);
      var block = await provider.getBlock(call.blockHash);
      call.timestamp = block.timestamp * 1000;
      call.date = moment(block.timestamp * 1000).format('DD MMMM YY, HH:mm');
      call.execDate = moment((block.timestamp + call.delay) * 1000).format('DD MMMM YY, HH:mm');
      call.targetLabel = await label(call.target);

      var data = await $getJSON('https://api.etherscan.io/api?module=contract&apikey=Q1SN85UMI8HDCDREN123VZK2M6UCBMIMD4&action=getabi&address=' + call.target);
      if (data.result == 'Max rate limit reached') {
        await wait(200);
        data = await $getJSON('https://api.etherscan.io/api?module=contract&apikey=Q1SN85UMI8HDCDREN123VZK2M6UCBMIMD4&action=getabi&address=' + call.target);
      }
      var contractABI = '';
      try {
        contractABI = JSON.parse(data.result);
        if (contractABI == '') throw 'err';
        var iface = new ethers.utils.Interface(contractABI);
        
        // contract is likely a proxy, fetch the implementation's ABI
        if (iface.functions['implementation()'] && iface.functions['upgradeTo(address)']) {
          var eip1967 = await provider.getStorageAt(call.target, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
          var ozProxy = null;
          if (!Number(eip1967)) ozProxy = await provider.getStorageAt(call.target, '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3');
          var implementationAddressStorageSlotValue = ozProxy || eip1967 || null;

          if (Number(implementationAddressStorageSlotValue) != 0) {
            var impl = '0x' + implementationAddressStorageSlotValue.slice(-40);
            data = await $getJSON('https://api.etherscan.io/api?module=contract&apikey=Q1SN85UMI8HDCDREN123VZK2M6UCBMIMD4&action=getabi&address=' + impl);
            if (data.result == 'Max rate limit reached') {
              await wait(200);
              data = await $getJSON('https://api.etherscan.io/api?module=contract&apikey=Q1SN85UMI8HDCDREN123VZK2M6UCBMIMD4&action=getabi&address=' + impl);
            }
            contractABI = JSON.parse(data.result);
            if (contractABI == '') throw 'err';
            iface = new ethers.utils.Interface(contractABI);
          }
        }

        var tx = iface.parseTransaction({ data: call.data });

        call.fnName = tx.signature; // tx.functionFragment.name;
        call.fnArgs = [];
        for (var j = 0; j < tx.functionFragment.inputs.length; j++) {
          var input = tx.functionFragment.inputs[j];
          var type = input.type;
          var name = tx.functionFragment.inputs[j].name || '';
          var value = tx.args[j].toString();
          var valueLabel = value;
          if (type == 'address') valueLabel = await label(value);
          if (type == 'uint256') valueLabel = formatNumber(value);
          if (type == 'address[]') {
            valueLabel = [];
            for (var k = 0; k < value.split(',').length; k++) {
              valueLabel.push(await label(value.split(',')[k]));
            }
            valueLabel = valueLabel.join(',');
          }

          call.fnArgs.push({ type, name, value, valueLabel });
        }
      }
      catch(e) {
        console.error('Error on contract', call.target + '\n', e, data);
        call.fnName = call.data.slice(2, 10) + '(...)';
        call.fnArgs = [
          {
            type: '-',
            name: '-',
            value: call.data.slice(10),
            valueLabel: ''
          }
        ];
      }
      call.loading = false;
    }

    // set state & redraw
    this.setState(this.state);
    this.forceUpdate();

    // make the data available in console & print
    window.state = this.state;
    console.log('window.state', window.state);
  }

  render() {
    return (
      <div className="timelock">
        <div className="card section">
          <h1 className="mb-3">Tribe DAO Timelocks</h1>
          { this.state.timelock == null ? <div className="info">
            <p>This page shows the latest transactions executed on the Tribe DAO timelocks, and their current configuration.</p>
            <p>Select one of the timelocks below :</p>
            <ul>
              { Object.keys(this.state.timelocks).map((label) => <li>
                <a href="javascript:void(0)" onClick={(e)=>this.setTimelock(this.state.timelocks[label])}>{label}</a>
              </li>)}
            </ul>
          </div> : null }
          { this.state.calls.length == 0 && this.state.timelock ? <div className="info">
            <div className="text-center">Reading latest on-chain data...</div>
          </div> : null }
          { this.state.calls.length != 0 ? <div className="info">
            <p>
              <strong>Link to the timelock: </strong> <a target="_blank" href={'https://etherscan.io/address/' + this.state.timelock}>
                {this.state.timelock}
              </a>
              &nbsp;
              (<a href="javascript:void(0)" onClick={(e)=>this.setTimelock(null)}>back to timelock list</a>)
            </p>
            <p>
              <strong>Minimum execution delay: </strong> {Math.round(this.state.minDelay/3600)} hours
            </p>
          </div> : null }
          { this.state.calls.length != 0 ? <div className="roles">
            <p>
              <strong>Admins: </strong>
              { Object.keys(this.state.roles['0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5']).map((address) => <a target="_blank" href={'https://etherscan.io/address/' + address} className="address">
                {this.state.roles['0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5'][address]}
              </a>)}
            </p>
            <p>
              <strong>Proposers: </strong>
              { Object.keys(this.state.roles['0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1']).map((address) => <a target="_blank" href={'https://etherscan.io/address/' + address} className="address">
                {this.state.roles['0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1'][address]}
              </a>)}
            </p>
            <p>
              <strong>Executors: </strong>
              { Object.keys(this.state.roles['0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63']).map((address) => <a target="_blank" href={'https://etherscan.io/address/' + address} className="address">
                {this.state.roles['0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63'][address]}
              </a>)}
            </p>
          </div> : null }
          { this.state.calls.length != 0 ? <div className="transactions">
            { (this.state.calls || []).map((call, i) => <div key={i} className={'transaction ' + (i%2?'odd':'even') + (call.delay ? ' pending' : '')}>
              { call.loading ? <div>
                Loading...
              </div> : 
              <div>
                <div className="date">
                  <a href={'https://etherscan.io/tx/' + call.txHash} target="_blank">{call.date}</a>
                </div>
                <div className="fn">
                  <a href={'https://etherscan.io/address/' + call.target} target="_blank">{call.targetLabel}</a>.{call.fnName}
                </div>
                { call.delay ? <div>
                  <div style={{'float':'right'}}>Exec after {call.execDate}</div>
                  <strong>Transaction id</strong> {call.id}
                </div> : null}
                <div>
                  <strong>{ call.delay ? 'Queued by' : 'Executed by'}</strong>
                  &nbsp;
                  <a href={'https://etherscan.io/address/' + call.executedBy} target="_blank">{call.executedByLabel}</a>
                </div>
                <div>
                  <strong>Value</strong> {call.value / 1e18} ether
                </div>
                { call.fnArgs.length ? <table className="args">
                  <thead>
                    <tr>
                      <th>Argument</th>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    { (call.fnArgs || []).map((arg, i) => <tr key={i}>
                      <td>{i}</td>
                      <td>{arg.type}</td>
                      <td>{arg.name}</td>
                      <td title={arg.value}>
                        {
                          (arg.type == 'address') ? <div>
                            <a href={'https://etherscan.io/address/' + arg.value} target="_blank">{arg.valueLabel}</a>
                          </div> :
                          (arg.type == 'address[]') ? <div>
                            { (arg.value.split(',') || []).map((addr, i) => <div key={i}>
                              {i}: <a href={'https://etherscan.io/address/' + addr} target="_blank">{arg.valueLabel.split(',')[i]}</a>
                            </div>)}
                          </div> :
                          (arg.type == 'uint256[]') ? <div>
                            { (arg.value.split(',') || []).map((num, i) => <div key={i}>
                              {i}: {formatNumber(num)}
                            </div>)}
                          </div> :
                          (arg.type == '-') ? <div>
                            { (arg.value.match(/.{1,64}/g) || []).map((chunk, i) => <div key={i}>
                              {i}: {chunk}
                            </div>)}
                          </div> :
                          <div>{arg.valueLabel || arg.value}</div>
                        }
                      </td>
                    </tr>)}
                  </tbody>
                </table> : null}
                <pre style={{'display':'none'}}>{JSON.stringify(call,null,2)}</pre>
              </div>}
            </div>)}
          </div> : null }
        </div>
      </div>
    );
  }
}

export default c;

function wait(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function formatNumber(x) {
  x = Number(x);
  let ret = x >= 0 ? '' : '-';
  let absX = Math.abs(x);
  let suffix = '';
  if (absX >= 1e17) {
    // 18 decimals... probably
    absX = absX / 1e18;
    suffix = ' (18 decimals)';
  } else if (absX >= 1e5) {
    // 6 decimals... probably
    absX = absX / 1e6;
    suffix = ' (6 decimals)';
  }
  if (absX > 1e6) {
    // > 1M
    absX = absX / 1e6;
    suffix = 'M' + suffix;
  } else if (absX > 100e3) {
    // > 100k
    absX = absX / 1e3;
    suffix = 'k' + suffix;
  }
  const xRound = Math.round(absX * 100) / 100;
  ret += xRound + suffix;
  return ret;
}