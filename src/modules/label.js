import $ from 'jquery';
import { getProvider } from '../components/wallet/wallet';

const $get = (url) => {
  return new Promise((resolve) => {
    $.get(url, resolve);
  });
}

export default label;
window.label = label;

var labels = null;
var ensNames = {};
var staticLabels = {};
staticLabels['0x001509564e1a6dbad921feea38735c2491c8a7d4'.toLowerCase()] = 'DioDionysos';
staticLabels['0x40b12d200404c0d082b6d088ab24ceded6bcf8c2'.toLowerCase()] = 'Joey';
staticLabels['0xE2388f22cf5e328C197D6530663809cc0408a510'.toLowerCase()] = 'Joey';
staticLabels['0xc8eefb8b3d50ca87Da7F99a661720148acf97EfA'.toLowerCase()] = 'Brianna';
staticLabels['0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148'.toLowerCase()] = 'Eswak';
staticLabels['0xcE96fE7Eb7186E9F894DE7703B4DF8ea60E2dD77'.toLowerCase()] = 'Eswak';
staticLabels['0xefe96f4dfed2f47362be86d936f3d7b9f553585d'.toLowerCase()] = 'Meertitan';
staticLabels['0xA6D08774604d6Da7C96684ca6c4f61f89c4e5b96'.toLowerCase()] = 'Bruno';
staticLabels['0x51300B7a9E75376ABaB7B3d4F9Fd505bB314BE43'.toLowerCase()] = 'Count Vidal';
staticLabels['0x6A42c1F4dd8d9FCF3bD7Bbcda396d12dDA35ee9b'.toLowerCase()] = 'Cozeno';
staticLabels['0x33AD909b6713Dd839F46a798A12D2Fd68b26D328'.toLowerCase()] = 'Face Shaver';
staticLabels['0x512A964844b2AB7Bc5b8bcAA77688Cb8931a15a8'.toLowerCase()] = 'Pavel';
staticLabels['0xb81cf4981ef648aaa73f07a18b03970f04d5d8bf'.toLowerCase()] = 'klob';
staticLabels['0x3308Fe7f84245134dAF735cdf1B8188bfC41Df7D'.toLowerCase()] = 'Tom';
staticLabels['0xB6B9E9e56AB5a4AF927faa802ac93786352f3af9'.toLowerCase()] = 'Spearbit';
staticLabels['0xB1e7cC3fa5924518530b6efA0Ca484e71343c0E5'.toLowerCase()] = 'Immunefi 1';
staticLabels['0x20cA5E93Db3cfec02407467945b991f544e8f7A5'.toLowerCase()] = 'Immunefi 2';
staticLabels['0x9C7538C1A4115321732868BD3733583c14e4a489'.toLowerCase()] = 'Tribe DAO Grants Multisig';
staticLabels['0xC2bc2F890067C511215f9463a064221577a53E10'.toLowerCase()] = 'Code4rena';
staticLabels['0x2974Ec195D9b7e9B012769B890106885C165D6f5'.toLowerCase()] = 'Zellic';
staticLabels['0x192bDD30D272AabC2B1c3c719c518F0f2d10cc60'.toLowerCase()] = 'WatchPug (Code4rena warden)';
staticLabels['0xe1F2a7342459b54fBFea9F40695cdD46EFadEEeE'.toLowerCase()] = 'Compound FEI PCVDeposit';
staticLabels['0x525eA5983A2e02abA8aA0BE7D15Cd73150812379'.toLowerCase()] = 'Fuse pool 156 (Convex) FEI PCVDeposit';
staticLabels['0xB8f482539F2d3Ae2C9ea6076894df36D1f632775'.toLowerCase()] = 'Fei Guardian Multisig';
staticLabels['0xbC9C084a12678ef5B516561df902fdc426d95483'.toLowerCase()] = 'Tribe OA Timelock';
staticLabels['0x7DC26A320a9f70Db617e24B77aCA1D3DC48C5721'.toLowerCase()] = 'Tribe OPS OA Timelock';
staticLabels['0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c'.toLowerCase()] = 'Tribe DAO Timelock';
staticLabels['0x35ED000468f397AA943009bD60cc6d2d9a7d32fF'.toLowerCase()] = 'Tribe OA Multisig';
staticLabels['0xe0C7DE94395B629860Cbb3c42995F300F56e6d7a'.toLowerCase()] = 'Tribal Council Timelock';
staticLabels['0x2EC598d8e3DF35E5D6F13AE2f05a7bB2704e92Ea'.toLowerCase()] = 'Tribal Coulcil Multisig';

async function label(address) {
  if (staticLabels[(address || '').toLowerCase()]) return staticLabels[(address || '').toLowerCase()];

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
  var protocolLabel = (labels || {})[(address || '').toUpperCase()];
  if (protocolLabel) return protocolLabel;
  if (!protocolLabel) {
    if (ensNames[address] != false) {
      var ensName = ensNames[address] || await getProvider().lookupAddress(address);
      ensNames[address] = ensName || false;
      if (ensName) return ensName;
    }
  }
  return address;
}
