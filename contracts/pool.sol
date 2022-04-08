// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import "./SbToken.sol";
import "./LpToken.sol";

contract pool {
    SbToken public sbt;
    LpToken public lp;
    uint private immutable feesRate = 3;
    uint private immutable feesDecimal = 1000;
    //uint public ethBalance;
    address public owner;
    uint public sbtBalance = 0;  //sbt available to use & calculate
    uint private sbtReserved = 0; //sbt reserved for liquidity provider reward
    bool public isRunning = false;

    uint k;
    uint estimateTokenSb;
    uint estimateTokenEth;
    uint public sbtGet =0;
    bool oneTime = true;

    event PoolInitialised(
        address account,
        address token,
        uint amountSbt,
        uint amountEth
    );


    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}


    modifier onlyOwner {
      require(msg.sender == owner,"Only owner is allowed for this action.");
      _;
    }

    modifier checkPool() {
        require(isRunning);
        _;
    }

    modifier checkBalance() {
        require(msg.value > 0);
        require(msg.value <= msg.sender.balance);
        _;
    }

    modifier checkBalance2(uint amountSbt) {
        require(amountSbt > 0);
        require(amountSbt <= sbt.balanceOf(msg.sender));
        _;
    }

    constructor(SbToken _sbToken) {
        sbt = _sbToken;
        
    constructor(SbToken _sbToken, LpToken _lpToken) {
        sbt = _sbToken;
        lp = _lpToken;
        owner = msg.sender;
    }

    
    function settingUp( uint sbtSupply) public payable onlyOwner{
       
        
        sbt.transferFrom(msg.sender,payable (this), sbtSupply);
        //payable(address(this)).transfer(msg.value);


        //require(msg.sender == owner, "Only owner can deploy the pool.");
        sbtBalance += sbtSupply;
        isRunning = true;

        //emit PoolInitialised(msg.sender, address(sbt), sbtSupply, msg.value);

        lp.create(msg.sender, msg.value, sbtSupply);
    }

    


    //get the 99.7% of sbt (used for swap)
    function getActualSbt (uint fullSbt) internal pure returns(uint){
        return (fullSbt * (feesDecimal - feesRate)) / feesDecimal;
        
    }

    //get the 0.3% fees of sbt (swap)(if giving eth, convert reserved eth to sbt)
    function getReservedSbt (uint fullSbt) internal pure returns(uint){
        return  (fullSbt * feesRate) / feesDecimal;
    }

    function getBalanceEth () public view returns(uint){
        return address(this).balance;
    }

    function isPoolRunning () public view returns(bool){
        return isRunning;
    }

    
    //swap
    function calculateConstant() internal{
        if(oneTime){
            k = address(this).balance * sbtBalance;
            oneTime = false;
        }
       
    }

    function getSwapTokenSbEstimate(uint _amountTokenEth) public checkPool returns (uint, uint)
    {
        uint tokenEthAfter = address(this).balance + _amountTokenEth;
        calculateConstant();
        estimateTokenSb = sbtBalance - (k / tokenEthAfter);
        sbtGet = getActualSbt(estimateTokenSb);
        return (estimateTokenSb,sbtGet);
    }

    function getSwapTokenEthEstimate(uint _amountTokenSb)public checkPool returns (uint)
    {
        uint tokenSbAfter = sbtBalance + getActualSbt(_amountTokenSb);
        calculateConstant();
        estimateTokenEth = address(this).balance - (k / tokenSbAfter);
        return (estimateTokenEth);
    }

    function getEthNeed(uint _amountSbt) public checkPool returns (uint, uint)
    {
        uint tokenSbtAfter = sbtBalance - _amountSbt;
        calculateConstant();
        uint ethNeed = (k / tokenSbtAfter) - address(this).balance;
        sbtGet = getActualSbt(_amountSbt);
        return (ethNeed,sbtGet);
    }

    function getSbtNeed(uint _amountEth) public checkPool returns (uint)
    {
        uint tokenEthAfter = address(this).balance - _amountEth;
        calculateConstant();
        uint sbtNeed = (k / tokenEthAfter) - sbtBalance;
        uint actual = sbtNeed + getReservedSbt(sbtNeed);
        return (actual);
    }

    function tokenEthSwapTokenSb(uint amountSbt, uint getAmount) external checkBalance payable{
        sbtReserved = getReservedSbt(amountSbt);
        payable(address(this)).transfer(msg.value);
        sbt.transfer(msg.sender, getAmount);
        sbtBalance -= getAmount;
    }

    function tokenSbSwapTokenEth(uint amountSbt, uint amountEth) checkBalance2(amountSbt) public{
        sbtReserved = getReservedSbt(amountSbt);
        sbt.transferFrom(msg.sender, address(this), amountSbt);
        payable(msg.sender).transfer(amountEth);
        sbtBalance += amountSbt;
    }

    
  
    
}