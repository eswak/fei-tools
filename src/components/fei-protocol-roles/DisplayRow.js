import { checkProperties } from 'ethers/lib/utils';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { get } from 'jquery';
import { update } from 'lodash';

// set up the connection to alchemy node
const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT');




async function updateTime(block){
    const blockData = new Date((await provider.getBlock(block)).timestamp * 1000).toISOString().split('T')[0]
    return blockData
}





class DisplayRow extends React.Component {

    state = {
        grantedDate: null,
        revokedDate: null,
      }


    async componentDidMount() {
        const grantedDate = await updateTime(this.props.blockGrant);
        this.setState({ grantedDate: grantedDate })
        if(this.props.revoked){
            const revokedTime = await updateTime(this.props.blockRevoke);
            this.setState({revokedDate: revokedTime})
            console.log(this.state.revokedDate)
        }

    };


    render() {
        return ((<tr key={this.props.rowkey} className={this.props.rowkey % 2 ? 'odd' : 'even'}>
            <td>
                {this.props.rolelabel}
            </td>
            <td>
                <a href={'https://etherscan.io/address/' + this.props.address} target="_blank">
                    {this.props.label}
                </a>
            </td>
            {this.state.grantedDate == null ? <td className="text-center">
                {'1337-13-37'}
            </td>
            : <td className="text-center">
                <a href={'https://etherscan.io/tx/' + this.props.grantTransaction} target="_blank">{this.state.grantedDate}</a>
            </td>}
            
            {this.props.revoked === true  ? <td className="text-center">
                {this.state.revokedDate === null ? '1337-13-37' :
                    <a href={'https://etherscan.io/tx/' + this.props.revokeTransaction} target="_blank">{this.state.revokedDate}</a>}
                  </td>
                  : null
              }
        </tr>))
    }

}


export default DisplayRow;