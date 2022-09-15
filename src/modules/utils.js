module.exports = {
  formatNumber,
  copyToClipboard
};

// format a number to 'XX,XXX,XXX'
function formatNumber(n, decimals) {
  decimals = decimals || '18';
  return String(Math.floor(n / Math.pow(10, decimals))).replace(/(.)(?=(\d{3})+$)/g, '$1,');
}

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
