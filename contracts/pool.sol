// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import "./SbToken.sol";
import "./LpToken.sol";

contract pool {
    SbToken public sbt;
    uint private immutable feesRate = 3;
    uint private immutable feesDecimal = 1000;
    //uint public ethBalance;
    address public owner;
    uint public sbtBalance = 0;  //sbt available to use & calculate
    uint private sbtReserved = 0; //sbt reserved for liquidity provider reward
    bool public isRunning = false;

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

    constructor(SbToken _sbToken) {
        sbt = _sbToken;
        owner = msg.sender;
    }

    

    function settingUp( uint sbtSupply) public payable onlyOwner{
       
        
        //sbt.transferFrom(sender,payable (this), sbtSupply);

        //require(msg.sender == owner, "Only owner can deploy the pool.");
        sbtBalance += sbtSupply;
        isRunning = true;

        //emit PoolInitialised(msg.sender, address(sbt), sbtSupply, msg.value);
    }


    //get the 99.7% of sbt (used for swap)
    function getActualSbt (uint fullSbt) internal pure returns(uint){
        return (fullSbt * (feesDecimal - feesRate)) / feesDecimal;
        
    }

    //get the 0.3% fees of sbt (swap)(if giving eth, convert reserved eth to sbt)
    function getReservedSbt (uint fullSbt) internal pure returns(uint){
        return  (fullSbt * feesRate) / feesDecimal;
    }

    function getBalanceSbt () public view returns(uint){
        return sbtBalance;
    }

    function getBalanceEth () public view returns(uint){
        return address(this).balance;
    }

    function isPoolRunning () public view returns(bool){
        return isRunning;
    }
    
    
}