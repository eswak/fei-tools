import React from 'react';
import { ethers } from 'ethers';

// set up the connection to alchemy node
const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/2I4l_G0EvVf0ORh6X7n67AoH1xevt9PT');



/// function to get the date based on block number
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
        // get the date for the added column
        const grantedDate = await updateTime(this.props.blockGrant);
        this.setState({ grantedDate: grantedDate })

        //if it was removed, // get the date for the remove column
        if(this.props.revoked){
            const revokedTime = await updateTime(this.props.blockRevoke);
            this.setState({revokedDate: revokedTime})
        }

    };


    render() {
        return ((<tr key={this.props.rowkey} className={(this.props.rowkey % 2 ? 'odd' : 'even') + this.props.last}>
            <td>
                {this.props.rolelabel}
            </td>
            <td title="view account on etherscan">
                <a href={'https://etherscan.io/address/' + this.props.address} target="_blank">
                    {this.props.label}
                </a>
            </td>
            {this.state.grantedDate == null ? <td className="text-center">
                {'----------'}
            </td>
            : <td className="text-center" title="view transaction on etherscan">
                <a href={'https://etherscan.io/tx/' + this.props.grantTransaction} target="_blank">{this.state.grantedDate}</a>
            </td>}
            
            {this.props.revoked === true  ? <td className="text-center" title="view transaction on etherscan">
                {this.state.revokedDate === null ? '----------' :
                    <a href={'https://etherscan.io/tx/' + this.props.revokeTransaction} target="_blank">{this.state.revokedDate}</a>}
                  </td>
                  : null
              }
        </tr>))
    }

}


export default DisplayRow;