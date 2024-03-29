import React, { Component } from "react";
import SbToken from "./contracts/SbToken.json"
import LpToken from "./contracts/LpToken.json"
import pool from "./contracts/pool.json"
import getWeb3 from "./getWeb3";
import swap from "./contracts/swap.json"


import { TiSpanner } from "react-icons/ti";
import { MdSwapVert } from "react-icons/md";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { AiOutlineArrowDown } from "react-icons/ai";
import { HiOutlinePlusCircle } from "react-icons/hi";
import { AiOutlineSwap } from "react-icons/ai"
import { BsBoxArrowUp, BsBoxArrowDown } from "react-icons/bs"

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
    poolRunning: false,
    loading: true,
    ethValue: null,
    sbtValue: null,
    ethToSbt: true,
    sliderValue: 0,
    sbtGet: 0,
    percent: 0,
    percentSlide: false,
    withdrawETH: 0.0000000000,
    withdrawSBT: 0.0000000000,
    withdrawReward: 0.0000000000,
    lpAmount: 0.0000000000,
    totalLp: 0,
    withdrawLp: 0,

    lpDetail: { providedEth: 0, providedSbt: 0, reward: 0, lpToken: 0 }
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

    await this.getLpTokenContract();

    //detect metamask account change
    window.ethereum.on('accountsChanged', (accounts) => this.setState({ accounts: accounts }, () => this.getLpDetail()));
  };

  //convert token to wei
  tokenToWei = (n) => {
    return this.state.web3.utils.toWei(n, 'ether');
  }

  //convert wei to token
  weiToToken = (n) => {
    return this.state.web3.utils.fromWei(n, 'ether');
  }

  getPoolContract = async () => {
    try {

      // Get the contract instance.
      const networkId = await this.state.web3.eth.net.getId();
      const deployedNetwork = pool.networks[networkId];
      const instance = new this.state.web3.eth.Contract(
        pool.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // const sbtBalance = await instance.methods.sbtBalance().call();
      // const ethBalance = await instance.methods.getBalanceEth().call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ poolContract: instance, }, () => this.getPoolValue());
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

  getLpTokenContract = async () => {

    try {
      // Get the contract instance.
      const networkId = await this.state.web3.eth.net.getId();
      const deployedNetwork = LpToken.networks[networkId];
      const instance = new this.state.web3.eth.Contract(
        LpToken.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set contract to the state
      this.setState({ lpTokenContract: instance }, () => this.getLpDetail());
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load lptoken contract or web3 or accounts. Check console for details.`,
      );
      console.error(error);
    }
  }

  getLpDetail = async () => {
    var lp = await this.state.poolContract.methods.getAmountWithdraw(this.state.accounts[0]).call();
    const { 0: lpToken, 1: providedSbt, 2: providedEth, 3: reward } = lp;
    lp = { lpToken, providedSbt, providedEth, reward };

    const totalLp = await this.state.lpTokenContract.methods.totalSupply().call();

    this.setState({ lpDetail: lp, totalLp: totalLp });
  }



  deployPool = async () => {

    await this.state.sbTokenContract.methods.approve(this.state.poolContract.options.address, this.tokenToWei(this.state.setUpSbt.toString())).send({ from: this.state.accounts[0] });

    await this.state.poolContract.methods.settingUp(this.tokenToWei(this.state.setUpSbt.toString())).send({ value: this.tokenToWei(this.state.setUpEth.toString()), from: this.state.accounts[0] }).on('transactionHash', function () { });
    

    this.getPoolValue();
    this.getLpDetail();
  };

  getPoolValue = async () => {
    const deployed = await this.state.poolContract.methods.isRunning().call()
    const sbtBalance = await this.state.poolContract.methods.sbtBalance().call();
    const ethBalance = await this.state.poolContract.methods.getBalanceEth().call();

    this.setState({ poolRunning: deployed, poolSbtBalance: this.weiToToken(sbtBalance), poolEthBalance: this.weiToToken(ethBalance) });
  }

  estimateSbt = async () => {
    const estimate = await this.state.poolContract.methods.getSwapTokenSbEstimate(this.tokenToWei(this.state.ethValue.toString())).call()
    const { 0: sbtEstimate, 1: sbtGet } = estimate;

    this.setState({ sbtValue: this.weiToToken(sbtEstimate) });
    this.setState({ sbtGet: this.weiToToken(sbtGet) });
  }

  estimateEth = async () => {
    const ethEstimate = await this.state.poolContract.methods.getSwapTokenEthEstimate(this.tokenToWei(this.state.sbtValue.toString())).call()

    this.setState({ ethValue: this.weiToToken(ethEstimate) });

  }

  getEthNeed = async () => {

    const eth = await this.state.poolContract.methods.getEthNeed(this.tokenToWei(this.state.sbtValue.toString())).call()
    const { 0: ethNeed, 1: sbtGet } = eth;

    this.setState({ ethValue: this.weiToToken(ethNeed) });
    this.setState({ sbtGet: this.weiToToken(sbtGet) });
  }

  getSbtNeed = async () => {
    console.log("hi")
    console.log(this.state.ethValue.toString())
    const sbt = await this.state.poolContract.methods.getSbtNeed(this.tokenToWei(this.state.ethValue.toString())).call()

    this.setState({ sbtValue: this.weiToToken(sbt) });
  }

  swap = async () => {
    if (this.state.ethToSbt) {
      await this.state.poolContract.methods.tokenEthSwapTokenSb(this.tokenToWei(this.state.sbtValue), this.tokenToWei(this.state.sbtGet)).send({ from: this.state.accounts[0], value: this.tokenToWei(this.state.ethValue) });
    } else {
      await this.state.sbTokenContract.methods.approve(this.state.poolContract.options.address, this.tokenToWei(this.state.sbtValue)).send({ from: this.state.accounts[0] }).on('transactionHash', (hash) => {
        this.state.poolContract.methods.tokenSbSwapTokenEth(this.tokenToWei(this.state.sbtValue), this.tokenToWei(this.state.ethValue)).send({ from: this.state.accounts[0] }).on('transactionHash', (hash) => {
          this.setState({ loading: false })
        })
      });
    }

    window.location.reload(false);
  }

  changeButton = async () => {
    this.setState({ ethToSbt: !this.state.ethToSbt, ethValue: "", sbtValue: "", sbtGet: "", insuffLiquidity: false });
  }

  checkSbt = async () => {
    const checkSbt = await this.state.poolContract.methods.calSBT(this.tokenToWei(this.state.depositEth.toString())).call()

    this.setState({ depositSbt: (this.weiToToken(checkSbt)) / 10 ** 18 });

  }

  checkEth = async () => {

    const checkEth = await this.state.poolContract.methods.calETH(this.tokenToWei(this.state.depositSbt.toString())).call()

    this.setState({ depositEth: (this.weiToToken(checkEth)) / 10 ** 18 });

  }

  deposit = async () => {
    await this.state.sbTokenContract.methods.approve(this.state.poolContract.options.address, this.tokenToWei(this.state.depositSbt.toString())).send({ from: this.state.accounts[0] });

    await this.state.poolContract.methods.deposit(this.tokenToWei(this.state.depositSbt.toString())).send({ value: this.tokenToWei(this.state.depositEth.toString()), from: this.state.accounts[0] }).on('transactionHash', function () { });
  
    window.location.reload(false);
  }



  withdraw = async () => {
    const networkId = await this.state.web3.eth.net.getId();
    const deployedNetwork = pool.networks[networkId];
    const instance = new this.state.web3.eth.Contract(
      pool.abi,
      deployedNetwork && deployedNetwork.address,
    );
    // this.setState({ sliderValue: this.weiToToken(sbtBalance) });

    //await this.state.sbTokenContract.methods.approve(this.state.poolContract.options.address, this.tokenToWei(SBTamount.toString())).send({ from: this.state.accounts[0] });
    await this.state.poolContract.methods.withdrawLiquity(this.state.sliderValue).send({ from: this.state.accounts[0] });
    this.setState({ withdrawETH: 0, withdrawSBT: 0, withdrawReward: 0, sliderValue: 0 }, () => {window.location.reload(false);});
    //this.state.sliderValue = 0;
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <nav className="nav">
          <div className="title">SBT SWAP</div>
          <div className="account">
            Account: {this.state.accounts[0]}
          </div>
        </nav>

        <div className="divBox">
          <h3><TiSpanner style={{ fontSize: 40, marginTop: -5, transform: "scaleX(-1)" }} /> Deploy Pool</h3>
          <div class="swapbox" style={{ marginBottom: 10 }}>

            <div class="swapbox_select" style={{ marginRight: 20 }}>
              <text>ETH</text>

            </div>

            <input type="number" class="form-control" placeholder="Amount of Ether..." step="0.00001" min="0.0001" style={{ width: "80%" }}
              value={this.state.setUpEth} onChange={(e) => this.setState({ setUpEth: e.target.value })}>

            </input>
          </div>

          <MdSwapVert style={{ fontSize: 40, marginBottom: -13, marginTop: -10 }} />

          <div class="swapbox" style={{ marginTop: 10 }}>

            <div class="swapbox_select" style={{ marginRight: 20 }}>
              <text>SBT</text>
            </div>

            <input type="number" class="form-control" placeholder="Amount of SbToken..." step="0.00001" min="0.0001" style={{ width: "80%" }}
              value={this.state.setUpSbt} onChange={(e) => this.setState({ setUpSbt: e.target.value })}></input>
          </div>

          {this.state.poolRunning ?
            <div style={{ width: "80%", margin: "auto", marginTop: 40, display: "flex" }}>

            </div>
            :
            <div style={{ width: "80%", margin: "auto", marginTop: 30, display: "flex", marginBottom: 30 }}>
              <div style={{ flex: 1, }}>
                1 ETH : {(this.state.setUpSbt / this.state.setUpEth) > 0 && (this.state.setUpSbt / this.state.setUpEth) < Infinity ? this.state.setUpSbt / this.state.setUpEth : 0} SBT
              </div>
              <div style={{ flex: 1, }}>
                1 SBT : {(this.state.setUpEth / this.state.setUpSbt) > 0 && (this.state.setUpEth / this.state.setUpSbt) < Infinity ? this.state.setUpEth / this.state.setUpSbt : 0} ETH
              </div>

            </div>
          }


          {this.state.poolRunning ?
            <button class="btn btn-primary disabled" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }}>
              Pool Is Running
            </button>
            :

            (this.state.setUpSbt / this.state.setUpEth) > 0 && (this.state.setUpSbt / this.state.setUpEth) < Infinity ?
              <button class="btn btn-primary" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }} onClick={() => this.deployPool()}>
                Deploy
              </button>
              :
              <button class="btn btn-primary disabled" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }}>
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


        </div>


        {/* swap */}
        <div className="divBox">
          <h3><AiOutlineSwap style={{ fontSize: 40, marginTop: -5 }} /> Swap</h3>

          <div class="swapbox">
            <div class="swapbox_select" style={{ marginRight: 20 }}>
              {
                (this.state.ethToSbt) ? <text>ETH</text>
                  :
                  <text>SBT</text>
              }

            </div>

            <input
              value={
                (this.state.ethToSbt) ?
                  this.state.ethValue
                  : this.state.sbtValue
              }
              type="number" class="form-control" placeholder=" Amount" id="input1" step="0.00001" min="0.0001" style={{ width: "80%" }}
              onChange={(e) => {
                if (this.state.ethToSbt) {

                  if (e.target.value.length < 10) {
                    this.setState({ ethValue: e.target.value }, () => { if (this.state.ethValue != 0) { this.estimateSbt() } })
                  } else {
                    this.setState({ sbtValue: "", sbtGet: "" })
                  }
                } else {
                  if (e.target.value.length < 10) {
                    this.setState({ sbtValue: e.target.value }, () => { if (this.state.sbtValue != 0) { this.estimateEth() } })
                  } else {
                    this.setState({ ethValue: "" })
                  }
                }
              }
              }></input>
          </div>

          <div>
            <button class="buttonChange" onClick={() => { this.changeButton() }}><AiOutlineArrowDown></AiOutlineArrowDown></button>
          </div>

          <div class="swapbox">
            <div class="swapbox_select" style={{ marginRight: 20 }}>
              {
                (this.state.ethToSbt) ? <text>SBT</text>
                  :
                  <text>ETH</text>
              }

            </div>
            <input
              value={
                (this.state.ethToSbt) ?
                  this.state.sbtValue
                  : this.state.ethValue
              } type="number" class="form-control" placeholder=" Amount" step="0.00001" min="0.0001" style={{ width: "80%" }} onChange={(e) => {
                {

                  if (this.state.ethToSbt) {

                    if (e.target.value.length < 10) {
                      this.setState({ sbtValue: e.target.value }, () => { if (this.state.sbtValue != 0) { this.getEthNeed() } });
                      if (e.target.value == this.state.poolSbtBalance) {
                        this.setState({ ethValue: "", sbtGet: "" })
                      }
                    } else {
                      this.setState({ ethValue: "", sbtGet: "" })
                    }

                  } else {
                    if (e.target.value.length < 10) {
                      this.setState({ ethValue: e.target.value }, () => { if (this.state.ethValue != 0) { this.getSbtNeed() } })
                      if (e.target.value == this.state.poolEthBalance) {
                        this.setState({ sbtValue: "" })
                      }
                    } else {
                      this.setState({ sbtValue: "" })
                    }

                  }

                }

              }}></input>
          </div>

          <div style={{ margin: 15, float: "left" }}>
            {
              (this.state.ethToSbt) ?
                <span>Receive: {this.state.sbtGet} SBT</span>
                :
                null
            }

          </div>
          <div>

            {
              (this.state.poolRunning == false) ?

                <button class="btn btn-primary disabled" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }}>
                  No Pool Created
                </button>
                : ((Math.round(this.state.sbtValue) <= Math.round(this.state.poolSbtBalance)) && this.state.ethToSbt) ?
                  <button class="btn btn-primary" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }} onClick={() => { if (this.state.ethValue > 0 && this.state.sbtValue > 0) { this.swap() } }} >
                    Swap
                  </button>
                  : ((this.state.ethToSbt == false) && (Math.round(this.state.ethValue) <= Math.round(this.state.poolEthBalance))) ?
                    <button class="btn btn-primary" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }} onClick={() => { if (this.state.ethValue > 0 && this.state.sbtValue > 0) { this.swap() } }} >
                      Swap
                    </button>
                    : <button class="btn btn-primary disabled" style={{ width: "100%", marginBottom: 15, backgroundColor: "#10154D" }}>
                      Insufficient liquidity for this trade
                    </button>
            }

          </div>


        </div>


        {/* deposit */}
        <div className="divBox">
          <h3><BsBoxArrowUp style={{ fontSize: 40, marginTop: -5 }} /> Deposit</h3>

          <div class="swapbox" style={{ marginBottom: 10 }}>

            <div class="swapbox_select" style={{ marginRight: 20 }}>
              <text>ETH</text>
            </div>

            <input type="number" class="form-control" placeholder="Amount of Ether" step="0.00001" min="0.0001" style={{ width: "80%" }}
              value={this.state.depositEth} onChange={(e) => {
                
                  
                    this.setState({ depositEth: e.target.value }, () => { if (this.state.depositEth != 0) { this.checkSbt() } })
                  
                

              }}>
            </input>
          
          </div>

          <HiOutlinePlusCircle style={{ fontSize: 40, marginBottom: -13, marginTop: -10 }} />

          <div class="swapbox" style={{ marginTop: 10 }}>

            <div class="swapbox_select" style={{ marginRight: 20 }}>
              <text>SBT</text>
            </div>

            <input type="number" class="form-control" placeholder="Amount of SbtToken" step="0.00001" min="0.0001" style={{ width: "80%" }}
              value={this.state.depositSbt} onChange={(e) => {
                
                  
                    this.setState({ depositSbt: e.target.value }, () => { if (this.state.depositSbt != 0) { this.checkEth() } })
                  
                
              }}>

            </input>
          </div>

          <div>{
            (!this.state.poolRunning) ?
              <button class="btn btn-primary disabled" style={{ width: "100%", marginBottom: 15, marginTop: 40, backgroundColor: "#10154D" }}>
                No Pool Created
              </button>
              :
              <button class="btn btn-primary" style={{ width: "100%", marginBottom: 15, marginTop: 40, backgroundColor: "#10154D" }}
                onClick={() => { if (this.state.depositEth > 0 && this.state.depositSbt > 0) { this.deposit() } }}>
                Deposit
              </button>}
          </div>


        </div>


        {/* withdraw */}
        <div className="divBox">
          <h3><BsBoxArrowDown style={{ fontSize: 38, marginTop: -5 }} /> Withdraw</h3>
          <div>Total LP Token Supply: {this.weiToToken(this.state.totalLp.toString())}</div>
          <br />
          <div><i>Your LP details</i></div>
          <div>LP Token : {this.weiToToken(this.state.lpDetail.lpToken.toString())}</div>
          <div>Available Eth : {this.weiToToken(this.state.lpDetail.providedEth.toString())}</div>
          <div>Available Sbt : {this.weiToToken(this.state.lpDetail.providedSbt.toString())}</div>
          <div>Available reward : {this.weiToToken(this.state.lpDetail.reward.toString())}</div>
          <br></br>
          <div class="range">
            <div class="sliderValue">
              <span>{this.state.sliderValue}%</span>
            </div>
            <div class="field">
              <div class="value left">0%</div>
              <input type="range" value={this.state.sliderValue} min="0" max="100" steps="1" disabled={this.state.percentSlide}
                onChange={(e) => {
                  if (this.weiToToken(this.state.lpDetail.providedEth.toString()) <= 0) {
                    this.setState({ percentSlide: true });
                  }
                  else {
                    this.setState({ percentSlide: false });
                    this.setState({ sliderValue: e.target.value })
                    const ETHamount = (this.weiToToken(this.state.lpDetail.providedEth.toString()) * e.target.value) / 100;
                    const SBTamount = (this.weiToToken(this.state.lpDetail.providedSbt.toString()) * e.target.value) / 100;
                    const rewardAmt = (this.weiToToken(this.state.lpDetail.reward.toString()) * e.target.value) / 100;
                    const lpAmount = this.weiToToken(this.state.lpDetail.lpToken.toString()) * e.target.value / 100;
                    this.setState({ withdrawETH: ETHamount, withdrawSBT: SBTamount, withdrawLP: lpAmount, withdrawReward: rewardAmt });
                  }
                }
                }></input>
              <div class="value right">100%</div>
            </div>
          </div>
          <br></br>
          <div class="withdrawBox">
            <div>LP Token : {this.state.withdrawLP}</div>
            <div>ETH : {this.state.withdrawETH}</div>
            <div>SBT : {this.state.withdrawSBT}</div>
            <div>Reward : {this.state.withdrawReward}</div>
          </div>

          <div>{(this.state.poolRunning) ?
            <button class="btn btn-primary" style={{ width: "100%", marginBottom: 15, marginTop: 40, backgroundColor: "#10154D" }} onClick={() => {
              if (this.weiToToken(this.state.lpDetail.providedEth) > 0) {
                this.withdraw()
              }
            }
            }>
              Withdraw
            </button> : <button class="btn btn-primary disabled" style={{ width: "100%", marginBottom: 15, marginTop: 40, backgroundColor: "#10154D" }}>
              No Pool Created
            </button>
          }</div>
        </div>

      </div >
    );
  }
}

export default App;
