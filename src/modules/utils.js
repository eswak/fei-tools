module.exports = {
  copyToClipboard
};

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
