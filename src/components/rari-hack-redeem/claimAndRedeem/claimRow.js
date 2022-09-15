import { toNumber } from 'lodash';
import React, { useState, useEffect } from 'react';
import { formatNumber, formatDisplayNumber } from '../../../modules/utils';
import decimals from '../data/decimals.json';

export default function ClaimRow(props) {
  const [value, setValue] = useState(props.balance || 0);
  const [displayValue, setDisplayValue] = useState(
    formatDisplayNumber(props.balance, decimals[props.cToken.toLowerCase()]) || 0
  );
  const [disable0Button, setDisable0Button] = useState(false);
  const [disable25Button, setDisable25Button] = useState(false);
  const [disable50Button, setDisable50Button] = useState(false);
  const [disable75Button, setDisable75Button] = useState(false);
  const [disable100Button, setDisable100Button] = useState(true);

  useEffect(() => {
    setDisplayValue(formatDisplayNumber(props.balance) || 0);
    setPercent(100);
  }, [props.reload]);

  function handleChange(event) {
    setDisplayValue(event.target.value);
    var toWrite = event.target.value;
    toWrite = BigInt(toWrite * 1e18);
    props.updateNumber(props.cToken, toWrite.toString());
    setDisable0Button(false);
    setDisable25Button(false);
    setDisable50Button(false);
    setDisable75Button(false);
    setDisable100Button(false);
  }

  function setPercent(percent) {
    if (percent == 0) {
      setDisplayValue(0);
      setValue('0');
      props.updateNumber(props.cToken, '0');
      setDisable0Button(true);
      setDisable25Button(false);
      setDisable50Button(false);
      setDisable75Button(false);
      setDisable100Button(false);
    }
    if (percent == 25) {
      let x = toNumber(props.balance);
      x = x / 4;
      setDisplayValue(formatDisplayNumber(x, decimals[props.cToken.toLowerCase()]));
      setValue();
      props.updateNumber(props.cToken, BigInt(x).toString());
      setDisable0Button(false);
      setDisable25Button(true);
      setDisable50Button(false);
      setDisable75Button(false);
      setDisable100Button(false);
    }
    if (percent == 50) {
      let x = toNumber(props.balance);
      x = x / 2;
      setDisplayValue(formatDisplayNumber(x, decimals[props.cToken.toLowerCase()]));
      setValue(BigInt(x).toString());
      props.updateNumber(props.cToken, BigInt(x).toString());
      setDisable0Button(false);
      setDisable25Button(false);
      setDisable50Button(true);
      setDisable75Button(false);
      setDisable100Button(false);
    }
    if (percent == 75) {
      let x = toNumber(props.balance);
      x = (x / 4) * 3;
      setDisplayValue(formatDisplayNumber(x, decimals[props.cToken.toLowerCase()]));
      setValue(BigInt(x).toString());
      props.updateNumber(props.cToken, BigInt(x).toString());
      setDisable0Button(false);
      setDisable25Button(false);
      setDisable50Button(false);
      setDisable75Button(true);
      setDisable100Button(false);
    }
    if (percent == 100) {
      setValue(props.balance);
      setDisplayValue(formatDisplayNumber(props.balance, decimals[props.cToken.toLowerCase()]));
      props.updateNumber(props.cToken, props.balance);
      setDisable0Button(false);
      setDisable25Button(false);
      setDisable50Button(false);
      setDisable75Button(false);
      setDisable100Button(true);
    }
  }

  return (
    <tr key={props.rowkey} className={props.rowkey % 2 ? 'odd' : 'even'}>
      <td title={props.cToken}>{props.cTokenLabel}</td>
      <td className="text-right">{formatNumber(props.balance, decimals[props.cToken.toLowerCase()])}</td>
      <td className="text-right">
        <input type="number" id={props.cToken} value={displayValue} onChange={handleChange} />
      </td>
      <td className="text-center">
        <button disabled={disable0Button} onClick={() => setPercent(0)}>
          0%
        </button>
        <button disabled={disable25Button} onClick={() => setPercent(25)}>
          25%
        </button>
        <button disabled={disable50Button} onClick={() => setPercent(50)}>
          50%
        </button>
        <button disabled={disable75Button} onClick={() => setPercent(75)}>
          75%
        </button>
        <button disabled={disable100Button} onClick={() => setPercent(100)}>
          100%
        </button>
      </td>
    </tr>
  );
}
