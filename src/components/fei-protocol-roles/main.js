import React, { Component } from 'react';
import { ethers } from 'ethers';
import deployerAbi from '../../abi/FeiDeployer.json';
import './main.css';
import label from '../../modules/label';



// set up the connection to alchemy node
const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT');

// Fei Deployer address set up
const deployerAddress = '0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9'

// create contract object to interact
const feiDeployer = new ethers.Contract(
  deployerAddress,
  deployerAbi,
  provider
)

///// ROLE TABLE FETCHING AND ORGANIZING

// create RoleTable
var roleTable = []

export async function fetchRoles() {
  // fetch all instances of RoleGranted events
  const grantedRoles = await feiDeployer.queryFilter('RoleGranted')

  // fetch all instances of RoleRevoked events
  const revokedRoles = await feiDeployer.queryFilter('RoleRevoked')



  //// ADDING THE ROLES TO THE TABLE

  // for each event add role instance to role list
  for (let i = 0; i < grantedRoles.length; i++) {
    // define instance of role
    const role = {
      key: grantedRoles[i]['args'][1]+grantedRoles[i]['args'][0],
      address: grantedRoles[i]['args'][1],
      role: grantedRoles[i]['args'][0],
      grantedOn: new Date((await grantedRoles[i].getBlock()).timestamp * 1000).toISOString().split('T')[0],
      revoked: false,
      revokedOn: null,
      grantTransaction: grantedRoles[i]['transactionHash'],
      revokeTransaction: null,
      label: await label(grantedRoles[i]['args'][1]),
      rolelabel: await label(grantedRoles[i]['args'][0]),
    }
    //check if role in array
    const index = roleTable.findIndex((object) => object.key === role.key);
    //if role not in array push to array
    if (index === -1){
      roleTable.push(role);

    }

  }

  //// UPDATING REVOKED ROLES

  for (let i = 0; i < revokedRoles.length; i++){
    // define revocation key
    const revokedRole = revokedRoles[i]['args'][1]+revokedRoles[i]['args'][0];

    //find index of revoked role
    const index = roleTable.findIndex((object) => object.key === revokedRole);

    //change revoked to true
    roleTable[index].revoked = true 

    //update revoked timestamp
    roleTable[index].revokedOn = new Date((await revokedRoles[i].getBlock()).timestamp * 1000).toISOString().split('T')[0]

    //update revokeTransaction
    roleTable[index].revokeTransaction = revokedRoles[i]['transactionHash']
  }
  console.log(roleTable)
  return roleTable
}


///// extracting and sorting by rolename the current roles


function currentRoles(roles){
  const sortedCurrentRoles = []

  for(let i=0; i<roles.length; i++){
    if(roles[i].revoked === false){
      sortedCurrentRoles.push(roles[i])
    }
  };
  sortedCurrentRoles.sort((a,b) => {
    if(a.rolelabel < b.rolelabel){
      return -1
    }
    if(a.rolelabel > b.rolelabel){
      return 1;
    }
    return 0;
  });
  return sortedCurrentRoles

}

///// extracting and sorting by rolename the revoked roles
function revokedRoles(roles){
  const sortedRevokedRoles = []

  for(let i=0; i<roles.length; i++){
    if(!roles[i].revoked === false){
      sortedRevokedRoles.push(roles[i])
    }
  };
  sortedRevokedRoles.sort((a,b) => {
    if(a.rolelabel < b.rolelabel){
      return -1
    }
    if(a.rolelabel > b.rolelabel){
      return 1;
    }
    return 0;
  });
  return sortedRevokedRoles

}






export default class roles extends Component {
        // two state to keep track of, data and loading status
        state = {
          roleData:[],
          current:[],
          revoked:[],
          isLoading: true
      }
        // loading the role data
        async componentDidMount()
            {
                const data = await fetchRoles();
                this.setState({roleData: data})


                const sortedCurrent = currentRoles(data);
                const sortedRevoked = revokedRoles(data);
                this.setState({current: sortedCurrent})
                this.setState({revoked: sortedRevoked})

                this.setState({isLoading: false})

                console.log(this.state.current)
                console.log(this.state.revoked)


            }
  // render the data
  render() {
    return (

      <div className="feiprotocolroles">
        <div className="card section">
          <h1 className="mb-3">Fei Protocol Roles</h1>
          <div className="info">
            <p>
              The <a href="https://etherscan.io/address/0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9" target="_blank">Core contract</a> of the Tribe DAO manages roles.
            </p>
            <p>
              See <a href="https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/core/TribeRoles.sol" target="_blank"> docs</a> for more info.
            </p>
          </div>



          
            { this.state.isLoading == true ? <div className="info">
            <hr/>
            <div className="text-center">Reading latest on-chain data...</div>
          </div> : null }

          
          { this.state.isLoading == false ? <div>
            <h2>Currently assigned roles</h2>
            <table className="mb-3">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Account</th>
                  <th className="text-center">Added</th>
                </tr>
              </thead>
              <tbody>
                { this.state.current.map((instance, i) => <tr key={i} className={i%2?'odd':'even'}>
                  <td>
                      {instance.rolelabel}
                  </td>
                  <td>
                    <a href={'https://etherscan.io/address/' + instance.address} target="_blank">
                      {instance.label}
                    </a>
                  </td>
                  <td className="text-center">
                    <a href={'https://etherscan.io/tx/' + instance.revokeTransaction} target="_blank">{instance.grantedOn}</a>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div> : null }

          <hr/>

          { this.state.isLoading == false ? <div>
            <h2>Formerly assigned roles</h2>
            <table className="mb-3">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Account</th>
                  <th className="text-center">Added</th>
                  <th className="text-center">Removed</th>
                </tr>
              </thead>
              <tbody>
                { this.state.revoked.map((instance, i) => <tr key={i} className={i%2?'odd':'even'}>
                  <td>

                      {instance.rolelabel}

                  </td>
                  <td>
                    <a href={'https://etherscan.io/address/' + instance.address} target="_blank">
                      {instance.label}
                    </a>
                  </td>
                  <td className="text-center">
                    <a href={'https://etherscan.io/tx/' + instance.revokeTransaction} target="_blank">{instance.grantedOn}</a>
                  </td>
                  <td className="text-center">
                    <a href={'https://etherscan.io/tx/' + instance.grantTransaction} target="_blank">{instance.revokedOn}</a>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div> : null }
        </div>
      </div>
    );
  }
}
