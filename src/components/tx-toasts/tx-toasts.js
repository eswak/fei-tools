import React, { Component } from 'react';
import './tx-toasts.css';
import { getProvider } from '../wallet/wallet';
import EventEmitter from '../../modules/event-emitter';

var intervalRefresh = null;
var allTx = {};

class TxToasts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tx: []
    };
  }

  async componentDidMount() {
    EventEmitter.on('tx', this.onTxAdd.bind(this));
  }

  async onTxAdd(tx) {
    // keep track of all broadcasted tx in the current session to avoid duplicates
    if (!tx || allTx[tx.hash]) return;
    allTx[tx.hash] = tx;

    const self = this;
    tx.status = 'pending';
    this.state.tx.push(tx);
    this.setState(this.state);

    var intervalCheckTx = setInterval(async () => {
      const txReceipt = await getProvider().getTransactionReceipt(tx.hash);
      if (txReceipt && txReceipt.blockNumber) {
        tx.status = 'mined';
        self.setState(self.state);
        setTimeout(() => {
          self.state.tx.forEach((stateTx, i) => {
            if (stateTx.hash === tx.hash) self.state.tx.splice(i, 1);
            self.setState(self.state);
          });
        }, 8000); // after mined, keep toast for 8s
        // stop checking if the tx is mined
        clearInterval(intervalCheckTx);
        // emit TxMined
        EventEmitter.dispatch('TxMined', {
          hash: tx.hash
        });
        // call callback
        tx.cb && tx.cb(txReceipt.blockNumber);
      }
    }, 5000); // every 5s, check for mined status
  }

  componentWillUnmount() {
    clearInterval(intervalRefresh);
    TxToasts;
  }

  render() {
    return (
      <div className="tx-toasts">
        {this.state.tx.map((tx, i) => (
          <a key={i} className="tx card" target="_blank" href={'https://etherscan.io/tx/' + tx.hash}>
            <div className="label">
              <span className={'status status-' + tx.status} title={'Status : ' + status}></span>
              {tx.label}
            </div>
            <div className="hash">Click to see tx on Etherscan: {tx.hash}</div>
          </a>
        ))}
      </div>
    );
  }
}

export default TxToasts;
