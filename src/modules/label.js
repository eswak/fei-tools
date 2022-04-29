import $ from 'jquery';

const $get = (url) => {
  return new Promise((resolve) => {
    $.get(url, resolve);
  });
}

export default label;

var labels = null;
async function label(address) {
  if (labels == null) {
    var mainnetAddresses = await $get('https://raw.githubusercontent.com/fei-protocol/fei-protocol-core/develop/protocol-configuration/mainnetAddresses.ts');
    
    var str = (
      ('{' + mainnetAddresses.split('MainnetAddresses = {')[1].split('};')[0] + '}')
        .replace('artifactName: AddressCategory.Core', 'artifactName:\'Core\'')
        .replace(/category:.*/g, '')
        .replace(/\/\/.*/g, '')
        .replace(/[\n\r ]/g, '')
        .replace(/,}/g, '}')
    );

    var protocolConfig;
    eval('protocolConfig = ' + str);
    labels = {};
    for (var key in protocolConfig) {
      labels[protocolConfig[key].address.toUpperCase()] = key;
    }
  }
  return (labels || {})[(address || '').toUpperCase()] || address;
}
