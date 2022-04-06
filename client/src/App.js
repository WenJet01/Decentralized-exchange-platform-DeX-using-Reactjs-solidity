import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import SbToken from "./contracts/SbToken.json"
import pool from "./contracts/pool.json"
import getWeb3 from "./getWeb3";

import IoIosSwap from "react-icons/io";
import { TiSpanner } from "react-icons/ti";
import { MdSwapVert } from "react-icons/md";

import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';





class App extends Component {
  //state = variables
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    poolSbtBalance: 0,
    poolEthBalance: 0,
    setUpEth: null,
    setUpSbt: null,
    ratioEthToSbt: 0,
    ratioSbtToEth: 0,
    poolRunning: false
  };

  componentDidMount = async () => {

    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Set contract to the state
      this.setState({ web3, accounts });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3 or accounts. Check console for details.`,
      );
      console.error(error);
    }


    await this.getSbTokenContract();

    await this.getPoolContract();

    // await this.getPoolSupply();

    await this.checkPoolRunning();


    //await this.runSimpleStorage();


  };

  //convert token to wei
  tokenToWei = (n) => {
    return this.state.web3.utils.toWei(n, 'ether');
  }

  //convert wei to token
  weiToToken = (n) => {
    return this.state.web3.utils.fromWei(n, 'ether');
  }

  runSimpleStorage = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );


      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.methods.set(5).send({ from: accounts[0] });

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call();

    // Update state with the result.
    this.setState({ storageValue: response });
  };

  getPoolContract = async () => {
    try {

      // Get the contract instance.
      const networkId = await this.state.web3.eth.net.getId();
      const deployedNetwork = pool.networks[networkId];
      const instance = new this.state.web3.eth.Contract(
        pool.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const sbtBalance = await instance.methods.getBalanceSbt().call();
      const ethBalance = await instance.methods.getBalanceEth().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ poolContract: instance ,poolSbtBalance:this.weiToToken(sbtBalance), poolEthBalance:this.weiToToken(ethBalance)});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load pool contract. Check console for details.`,
      );
      console.error(error);
    }
  }



  //get sbtoken contract
  getSbTokenContract = async () => {

    try {
      // Get the contract instance.
      const networkId = await this.state.web3.eth.net.getId();
      const deployedNetwork = SbToken.networks[networkId];
      const instance = new this.state.web3.eth.Contract(
        SbToken.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set contract to the state
      this.setState({ sbTokenContract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load sbtoken contract or web3 or accounts. Check console for details.`,
      );
      console.error(error);
    }
  }



  deployPool = async () => {
    const { accounts, sbTokenContract, poolContract } = this.state;



    //const response = await contract.methods.balanceOf(accounts[0]).call();
    await sbTokenContract.methods.approve(poolContract.options.address, this.tokenToWei(this.state.setUpSbt.toString())).send({ from: accounts[0] });
    //const allw = await sbTokenContract.methods.allowance(accounts[0],poolContract.options.address).call();
    //await poolContract.methods.settingUpEth().send({value:this.tokenToWei('1'), from:accounts[0]})
    await poolContract.methods.settingUp(this.tokenToWei(this.state.setUpSbt.toString())).send({ value: this.tokenToWei(this.state.setUpEth.toString()), from: accounts[0] }).on('transactionHash', function () { });
    //await poolContract.methods.settingUp(this.tokenToWei(this.state.setUpSbt.toString())).send({ value: this.tokenToWei(this.state.setUpEth.toString()), from: accounts[0] }).on('transactionHash', function () { });
    //await sbTokenContract.methods.transfer(poolContract.options.address, this.tokenToWei(this.state.setUpSbt.toString())).send({ from: accounts[0] });




    const sbtBalance = await poolContract.methods.getBalanceSbt().call();
    const ethBalance = await poolContract.methods.getBalanceEth().call();
    //const sbtBalance = '10000';
    //const ethBalance =  '1000000000';

    this.setState({ poolSbtBalance: this.weiToToken(sbtBalance), poolEthBalance: this.weiToToken(ethBalance) }, () => this.checkPoolRunning());


  };

  checkPoolRunning = async () => {
    const deployed = await this.state.poolContract.methods.isPoolRunning().call()

    this.setState({ poolRunning: deployed });
  }



  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div className="divBox">
          <h3><TiSpanner style={{ fontSize: 40, marginTop: -5, transform: "scaleX(-1)" }} /> Set Up Pool</h3>
          <div class="input-group mb-3" style={{ width: "70%", alignItems: "center", margin: "auto", marginTop: 20 }}>

            <span class="input-group-text" id="basic-addon1">ETH</span>

            <input type="number" class="form-control" placeholder="Amount of Ether..." step="0.00001" min="0.0001"
              value={this.state.setUpEth} onChange={(e) => this.setState({ setUpEth: e.target.value })}>

            </input>
          </div>

          <MdSwapVert style={{ fontSize: 40, marginBottom: -13, marginTop: -10 }} />

          <div class="input-group mb-3" style={{ width: "70%", alignItems: "center", margin: "auto", marginTop: 20 }}>

            <span class="input-group-text" id="basic-addon1">SBT</span>

            <input type="number" class="form-control" placeholder="Amount of SbToken..." step="0.00001" min="0.0001"
              value={this.state.setUpSbt} onChange={(e) => this.setState({ setUpSbt: e.target.value })}></input>
          </div>

          <div style={{ width: "80%", margin: "auto", marginTop: 30, display: "flex", marginBottom: 30 }}>
            <div style={{ flex: 1, }}>
              1 ETH : {(this.state.setUpSbt / this.state.setUpEth) > 0 && (this.state.setUpSbt / this.state.setUpEth) < Infinity ? this.state.setUpSbt / this.state.setUpEth : 0} SBT
            </div>
            <div style={{ flex: 1, }}>
              1 SBT : {(this.state.setUpEth / this.state.setUpSbt) > 0 && (this.state.setUpEth / this.state.setUpSbt) < Infinity ? this.state.setUpEth / this.state.setUpSbt : 0} ETH
            </div>

          </div>

          {this.state.poolRunning ?
            <button class="btn btn-primary disabled" style={{ width: "80%", marginBottom: 15 }}>
              Pool Is Running
            </button>
            :

            (this.state.setUpSbt / this.state.setUpEth) > 0 && (this.state.setUpSbt / this.state.setUpEth) < Infinity ?
              <button class="btn btn-primary" style={{ width: "80%", marginBottom: 15 }} onClick={() => this.deployPool()}>
                Deploy
              </button>
              :
              <button class="btn btn-primary disabled" style={{ width: "80%", marginBottom: 15 }}>
                Deploy
              </button>


          }

          <div style={{ width: "80%", margin: "auto", display: "flex", }}>
            <div style={{ flex: 1, }}>
              ETH Balance : {this.state.poolEthBalance}
            </div>
            <div style={{ flex: 1, }}>
              SBT Balance : {this.state.poolSbtBalance}
            </div>

          </div>



          {/* <div>The ETH balance is: {this.state.setUpEth}</div>
          <div>The SBT balance is: {this.state.setUpSbt}</div> */}
        </div>

      </div>
    );
  }
}

export default App;
