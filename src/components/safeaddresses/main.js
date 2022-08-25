import React, { Component } from 'react';
import { ethers } from 'ethers';
import PCVGuardianAbi from '../../abi/PCVGuardian.json';
import './main.css';
import label from '../../modules/label';

const provider = new ethers.providers.JsonRpcProvider(
  'https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT'
);

const pcvGuardianAddress = '0x02435948F84d7465FB71dE45ABa6098Fc6eC2993';
var pcvGuardian = new ethers.Contract(pcvGuardianAddress, PCVGuardianAbi, provider);

class c extends Component {
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
        remove: null,
        removeTx: null
      };
      safeAddresses[add.args[0]].add = new Date((await add.getBlock()).timestamp * 1000).toISOString().split('T')[0];
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
        remove: null,
        removeTx: null
      };
      safeAddresses[remove.args[0]].remove = new Date((await remove.getBlock()).timestamp * 1000)
        .toISOString()
        .split('T')[0];
      safeAddresses[remove.args[0]].removeTx = remove.transactionHash;
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
              <table className="mb-3">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th className="text-center">Removed</th>
                    <th className="text-center">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.safeAddresses.map((contract, i) => (
                    <tr key={i} className={i % 2 ? 'odd' : 'even'}>
                      <td>
                        <a href={'https://etherscan.io/address/' + contract.address} target="_blank">
                          {contract.label}
                        </a>
                      </td>
                      <td className="text-center">
                        <a href={'https://etherscan.io/tx/' + contract.removeTx} target="_blank">
                          {contract.remove}
                        </a>
                      </td>
                      <td className="text-center">
                        <a href={'https://etherscan.io/tx/' + contract.addTx} target="_blank">
                          {contract.add}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default c;
