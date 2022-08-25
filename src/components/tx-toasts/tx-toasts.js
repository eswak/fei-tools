import React, { Component } from 'react';
import './tx-toasts.css';
import { getProvider } from '../wallet/wallet';
import EventEmitter from '../../modules/event-emitter';

var intervalRefresh = null;

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
        }, 5000);
        clearInterval(intervalCheckTx);
      }
    }, 3000);
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
            <div className="hash">{tx.hash}</div>
          </a>
        ))}
      </div>
    );
  }
}

export default TxToasts;
