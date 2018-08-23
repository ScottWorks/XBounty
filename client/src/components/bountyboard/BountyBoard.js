import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite';

import formatData from '../../utils/formatData';
import getContractInstance from '../../utils/getContractInstance';
import getWeb3 from '../../utils/getWeb3';
import ipfsUpload from '../../utils/ipfs';

import BountyBoardContract from '../../contracts/BountyBoard.json';
import BountyContract from '../../contracts/Bounty.json';

import BountyForm from './BountyForm';
import BountyList from './BountyList';

// import './BountyBoard.css';

class BountyBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      account: null,
      bountyBoardInstance: null,
      bountyInstances: [],
      bountyDetails: [],
      bountyTotal: '',
      bountyDescription: '',
      voteDeposit: '',
      challengeDuration: '',
      voteDuration: '',
      currentBountyAddress: null
    };

    this.handleChange = this.handleChange.bind(this);
  }

  // componentDidMount = async () => {
  //   try {
  //     const { account, web3 } = this.props.data;

  //     // const web3 = await getWeb3();
  //     // const accounts = await web3.eth.getAccounts();
  //     // const account = accounts[0];
  //     console.log(web3);

  //     const bountyBoardInstance = await getContractInstance(
  //       web3,
  //       BountyBoardContract
  //     );

  //     const bountyAddresses = await bountyBoardInstance.methods
  //       .getAllBountyAddresses()
  //       .call({ from: account });

  //     bountyAddresses.forEach((bountyAddress) => {
  //       return this.getBounty(web3, account, bountyAddress);
  //     });

  //     this.setState({
  //       web3: web3,
  //       account: account,
  //       bountyBoardInstance: bountyBoardInstance
  //     });
  //   } catch (error) {
  //     // Catch any errors for any of the above operations.
  //     console.log(error);
  //   }
  // };

  handleChange(key, value) {
    this.setState({
      [key]: value
    });
  }

  // getBounty = async (web3, account, bountyAddress) => {
  //   const instance = await getContractInstance(
  //     web3,
  //     BountyContract,
  //     bountyAddress
  //   );

  //   const result = await instance.methods
  //     .getBountyParameters()
  //     .call({ from: account });

  //   console.log(result);
  //   let formattedData = await formatData(web3, result);

  //   this.setState({
  //     bountyInstances: [...this.state.bountyInstances, instance],
  //     bountyDetails: [...this.state.bountyDetails, formattedData]
  //   });
  // };

  createBounty = async (event) => {
    event.preventDefault();

    console.log(this.props);
    const { account, bountyBoardInstance, web3 } = this.props.data;

    const {
      // web3,
      // account,
      // bountyBoardInstance,
      bountyTotal,
      bountyDescription,
      voteDeposit,
      challengeDuration,
      voteDuration
    } = this.state;

    const convertedBountyTotal = web3.utils.toWei(bountyTotal, 'ether');
    const convertedVoteDeposit = web3.utils.toWei(voteDeposit, 'ether');
    const convertedchallengeDuration = challengeDuration * 3600;
    const convertedvoteDuration = voteDuration * 3600;

    const result = await bountyBoardInstance.methods
      .createBountyContract(
        convertedBountyTotal,
        bountyDescription,
        convertedVoteDeposit,
        convertedchallengeDuration,
        convertedvoteDuration
      )
      .send({
        from: account,
        value: convertedBountyTotal
      });

    let address = result.events.LogAddress.returnValues[0];
    let bountyInstance = this.props.getBounty(web3, account, address);

    this.setState({
      bountyInstances: [...this.state.bountyInstances, bountyInstance],
      bountyTotal: '',
      bountyDescription: '',
      voteDeposit: '',
      challengeDuration: '',
      voteDuration: ''
    });
  };

  uploadFile = async (event, bountyAddress) => {
    event.stopPropagation();
    event.preventDefault();

    const { account, web3 } = this.props.data;

    // const { account, web3 } = this.state;

    const file = event.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = async () => {
      const buffer = await Buffer.from(reader.result);

      const ipfsURL = await ipfsUpload(buffer);

      const instance = await getContractInstance(
        web3,
        BountyContract,
        bountyAddress
      );

      instance.methods.submitChallenge(ipfsURL).send({ from: account });
    };
  };

  freezeBounty = async (event, bountyAddress) => {
    event.preventDefault();
    const { account, web3 } = this.props.data;

    const instance = await getContractInstance(
      web3,
      BountyContract,
      bountyAddress
    );

    instance.methods.toggleEmergencyStop().send({ from: account });
  };

  render() {
    const { bountyDetails } = this.props.data;
    const {
      bountyTotal,
      bountyDescription,
      voteDeposit,
      challengeDuration,
      voteDuration
    } = this.state;

    return (
      <div className="BountyBoard">
        <h1>Create New Bounty</h1>

        <BountyForm
          data={{
            bountyTotal,
            bountyDescription,
            voteDeposit,
            challengeDuration,
            voteDuration
          }}
          handleChange={this.handleChange}
          createBounty={this.createBounty}
        />

        <BountyList
          data={{ bountyDetails }}
          uploadFile={this.uploadFile}
          freezeBounty={this.freezeBounty}
        />
      </div>
    );
  }
}

export default BountyBoard;
