// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import "./SbToken.sol";
import "./LpToken.sol";

contract pool {
    SbToken public sbt;
    uint256 private immutable feesRate = 3;
    uint256 private immutable feesDecimal = 1000;
    //uint public ethBalance;
    address public owner;
    uint256 public sbtBalance = 0; //sbt available to use & calculate
    uint256 private sbtReserved = 0; //sbt reserved for liquidity provider reward
    bool public isRunning = false;

    event PoolInitialised(
        address account,
        address token,
        uint256 amountSbt,
        uint256 amountEth
    );

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner is allowed for this action.");
        _;
    }

    modifier checkBalance() {
        require(msg.value > 0);
        require(msg.value <= msg.sender.balance);
        _;
    }

    constructor(SbToken _sbToken) {
        sbt = _sbToken;
        owner = msg.sender;
    }

    function settingUp(uint256 sbtSupply) public payable onlyOwner {
        sbt.transferFrom(msg.sender, payable(this), sbtSupply);
        //payable(address(this)).transfer(msg.value);

        //require(msg.sender == owner, "Only owner can deploy the pool.");
        sbtBalance += sbtSupply;
        isRunning = true;

        //emit PoolInitialised(msg.sender, address(sbt), sbtSupply, msg.value);
    }

    //get the 99.7% of sbt (used for swap)
    function getActualSbt(uint256 fullSbt) internal pure returns (uint256) {
        return (fullSbt * (feesDecimal - feesRate)) / feesDecimal;
    }

    //get the 0.3% fees of sbt (swap)(if giving eth, convert reserved eth to sbt)
    function getReservedSbt(uint256 fullSbt) internal pure returns (uint256) {
        return (fullSbt * feesRate) / feesDecimal;
    }

    function getBalanceEth() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawLiquity() external payable checkBalance {
        require(msg.sender == owner, "Only owner can withdraw funds");
        // require(amount <= balance[destAddr], "Insufficient funds");

        //SBT
        payable(address(this)).transfer(msg.value);
        sbt.transfer(msg.sender, 1000);
        sbtBalance -= 1000;
        //ETH
        payable(msg.sender).transfer(50);
    }
}
