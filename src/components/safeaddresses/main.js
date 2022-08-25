import React, { Component } from 'react';
import { ethers } from 'ethers';
import PCVGuardianAbi from '../../abi/PCVGuardian.json';
import './main.css';
import label from '../../modules/label';
import TableRow from './TableRow';

const provider = new ethers.providers.JsonRpcProvider(
  'https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT'
);

const pcvGuardianAddress = '0x02435948F84d7465FB71dE45ABa6098Fc6eC2993';
var pcvGuardian = new ethers.Contract(pcvGuardianAddress, PCVGuardianAbi, provider);

class c extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      safeAddresses: []
    };
  }

  async componentWillMount() {
    await this.refreshData();
  }

  async refreshData() {
    var safeAddresses = {};
    let adds = await pcvGuardian.queryFilter(pcvGuardian.filters.SafeAddressAdded());
    for (var i = 0; i < adds.length; i++) {
      var add = adds[i];
      safeAddresses[add.args[0]] = safeAddresses[add.args[0]] || {
        address: add.args[0],
        label: await label(add.args[0]),
        add: null,
        addTx: null,
        addBlock: null,
        remove: null,
        removeTx: null,
        removeBlock: null
      };
      safeAddresses[add.args[0]].addBlock = add.blockNumber;
      safeAddresses[add.args[0]].addTx = add.transactionHash;
    }

    let removes = await pcvGuardian.queryFilter(pcvGuardian.filters.SafeAddressRemoved());
    for (var i = 0; i < removes.length; i++) {
      var remove = removes[i];
      safeAddresses[remove.args[0]] = safeAddresses[remove.args[0]] || {
        address: remove.args[0],
        label: await label(remove.args[0]),
        add: null,
        addTx: null,
        addBlock: null,
        remove: null,
        removeTx: null,
        removeBlock: null
      };
      safeAddresses[remove.args[0]].removeBlock = remove.blockNumber;
      safeAddresses[remove.args[0]].removeTx = remove.transactionHash;
      safeAddresses[remove.args[0]].remove = true;
    }

    this.state.safeAddresses = Object.values(safeAddresses).sort(function (a, b) {
      return a.add < b.add ? 1 : -1;
    });

    // set state & redraw
    this.setState(this.state);
    this.forceUpdate();

    // make the data available in console & print
    window.state = this.state;
    console.log('window.state', window.state);
  }

  render() {
    return (
      <div className="safeaddresses">
        <div className="card section">
          <h1 className="mb-3">Fei Safe Addresses</h1>
          <div className="info">
            <p>
              The{' '}
              <a href="https://etherscan.io/address/0x02435948F84d7465FB71dE45ABa6098Fc6eC2993" target="_blank">
                PCV Guardian
              </a>{' '}
              can move PCV instantly between "safe" addresses which are pre-approved by the DAO (immutable smart
              contracts owned by the DAO).
            </p>
            <p>
              See{' '}
              <a href="https://fei-protocol.github.io/docs/docs/protocol/Mechanism/PCVManagement" target="_blank">
                {' '}
                docs
              </a>{' '}
              for more info.
            </p>
          </div>
          {this.state.safeAddresses.length == 0 ? (
            <div className="info">
              <hr />
              <div className="text-center">Reading latest on-chain data...</div>
            </div>
          ) : null}
          {this.state.safeAddresses.length != 0 ? (
            <div>
              <div>
                <h2>Current Safe Addresses</h2>
                <table className="mb-3">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th className="text-center">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.safeAddresses.map((contract, i) => {
                      return contract.remove !== true ? <TableRow rowkey={i} {...contract} /> : null;
                    })}
                  </tbody>
                </table>
              </div>
              <hr />
              <div>
                <h2>Deprecated Safe Addresses</h2>
                <table className="mb-3">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th className="text-center">Added</th>
                      <th className="text-center">Removed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.safeAddresses.map((contract, i) => {
                      return contract.remove == true ? <TableRow rowkey={i} {...contract} /> : null;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default c;
