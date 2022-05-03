import React, { Component } from 'react';
import { Contract, ethers } from 'ethers';
import TimelockAbi from '../../abi/Timelock.json';
import { getProvider, getSigner, getAccount } from '../wallet/wallet';
import $ from 'jquery';
import moment from 'moment';
import './main.css';
import label from '../../modules/label';

const $getJSON = (url) => {
  return new Promise((resolve) => {
    $.getJSON(url, resolve);
  });
}

var timelock = new ethers.Contract(
  '0xbC9C084a12678ef5B516561df902fdc426d95483', // OA Timelock
  TimelockAbi,
  getProvider()
);
window.provider = getProvider();

class c extends Component {
  constructor(props) {
    super(props);
    this.state = {
      calls: []
    };
  }

  async componentWillMount() {
    await this.refreshData();
  }

  /*componentWillUnmount() {
    clearInterval(intervalRefresh);
    clearTimeout(setProgressTimeout);
  }*/

  async refreshData() {
    this.state.calls = [];

    // read timelock events
    let calls = await timelock.queryFilter(timelock.filters.CallExecuted());
    for (var i = 0; i < calls.length; i++) {
      var call = calls[i];
      var from = (await call.getTransaction()).from;
      this.state.calls.unshift({
        loading: true,
        id: call.args.id,
        blockNumber: call.blockNumber,
        blockHash: call.blockHash,
        executedBy: from,
        //executedByLabel: await label(from),
        txHash: call.transactionHash,
        //timestamp: (await call.getBlock()).timestamp * 1000,
        //date: moment((await call.getBlock()).timestamp * 1000).format('DD MMMM YY, HH:mm'),
        index: call.args.index.toString(),
        target: call.args.target,
        //targetLabel: await label(call.args.target),
        value: call.args.value.toString(),
        data: call.args.data
      });
    }

    var that = this;
    var interval = setInterval(function() {
      that.setState(that.state);
      that.forceUpdate();
    }, 100);

    for (var i = 0; i < this.state.calls.length; i++) {
      var call = this.state.calls[i];
      
      call.executedByLabel = await label(call.executedBy);
      var block = await getProvider().getBlock(call.blockHash);
      call.timestamp = block.timestamp * 1000;
      call.date = moment(block.timestamp * 1000).format('DD MMMM YY, HH:mm');
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
          var eip1967 = await getProvider().getStorageAt(call.target, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
          var ozProxy = null;
          if (!Number(eip1967)) ozProxy = await getProvider().getStorageAt(call.target, '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3');
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

    clearInterval(interval);

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
          <h1 className="mb-3">OA Timelock Transactions</h1>
          <div className="info">
            <p>This page shows the latest transactions executed on the <a href="https://etherscan.io/address/0xbC9C084a12678ef5B516561df902fdc426d95483" target="_blank">Optimistic Approval Timelock</a>.</p>
            <p>See also the <a href="https://docs.google.com/spreadsheets/d/1Nvd96BeqKqW_muiIeq2xc7cqma27a2qf4_xaSZgL-Rg/edit#gid=0" target="_blank">OA Execution spreadsheet</a>.</p>
          </div>
          { this.state.calls.length == 0 ? <div className="info">
            <hr/>
            <div className="text-center">Reading latest on-chain data...</div>
          </div> : null }
          { this.state.calls.length != 0 ? <div className="transactions">
            { (this.state.calls || []).map((call, i) => <div key={i} className={'transaction ' + (i%2?'odd':'even')}>
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
                <div>
                  <strong>Executed by</strong> <a href={'https://etherscan.io/address/' + call.executedBy} target="_blank">{call.executedByLabel}</a>
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