// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.3;

import "./SbToken.sol";

abstract contract AddLiquidity {

    event deposit(uint amount);
    event addReward(uint amount);

    uint256 totalBalance;
    uint256 reward;
    uint256 rewardBalance;
    uint256 totalReward;
    uint providerGrp;
    mapping(address => uint) provider;
    mapping(address => uint) rewards;

    constructor(){
        rewardBalance = 0;
        providerGrp = 100000;
    }

    function addDeposit() public payable{
        require(msg.value>0, "Deposit amount must more than 0");
        provider[msg.sender] += msg.value;
        rewards[msg.sender] += totalReward;
        totalBalance += msg.value;
        emit deposit(msg.value);
    }

    function addLP() public payable{
        require(msg.value>0, "Deposit amount must more than 0");
        rewardBalance += msg.value;
        reward = ((msg.value * providerGrp)/totalBalance);
        totalReward += reward;
        emit addReward(msg.value);
    }

}