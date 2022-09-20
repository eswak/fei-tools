module.exports = {
  formatNumber,
  formatDisplayNumber,
  formatPercent,
  copyToClipboard
};

// format a number to 'XX,XXX,XXX'
function formatNumber(n, decimals, decimalsAfterZero) {
  decimals = decimals || '18';
  const nNormalized = n / Math.pow(10, decimals);
  const nRoundedDown = Math.floor(nNormalized);
  const nWithCommas = String(nRoundedDown).replace(/(.)(?=(\d{3})+$)/g, '$1,');
  let decimalsAfterZeroStr = '';
  if (decimalsAfterZero) {
    const decimals = Math.pow(10, decimalsAfterZero) * (nNormalized - nRoundedDown);
    decimalsAfterZeroStr = '.' + Math.floor(decimals);
    while (decimalsAfterZeroStr.length < decimalsAfterZero + 1) decimalsAfterZeroStr = decimalsAfterZeroStr + '0';
  }
  return nWithCommas + decimalsAfterZeroStr;
}

// format a number to 'XXXXXXXX'
function formatDisplayNumber(n, decimals) {
  decimals = decimals || '18';
  return String(Math.floor(n / Math.pow(10, decimals)));
}

// format a [0, 1] number to a %
function formatPercent(n) {
  return Math.floor(n * 100) + '%';
}

// Copy some string into the clipboard
function copyToClipboard(arg) {
  var str = arg;
  if (typeof str === 'object') {
    str = JSON.stringify(str, null, 2);
  }
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}
