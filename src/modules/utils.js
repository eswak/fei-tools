module.exports = {
  formatNumber,
  formatDisplayNumber,
  formatPercent,
  copyToClipboard
};

// format a number to 'XX,XXX,XXX'
function formatNumber(n, decimals) {
  decimals = decimals || '18';
  return String(Math.floor(n / Math.pow(10, decimals))).replace(/(.)(?=(\d{3})+$)/g, '$1,');
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
