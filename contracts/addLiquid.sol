//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./SbToken.sol";

contract addLiquidity is SbToken{
    address provider;
    SbToken sbt;

    mapping(address => uint) public checkLiquidity;

    constructor(address _eth){
        provider = msg.sender;
        sbt = SbToken(_eth);
    }

    function addLiquid(uint _amount) external{
        require(checkLiquidity[msg.sender] > 0, "First withdraw the funds");
        sbt.transferFrom(msg.sender, address(this), _amount);
        checkLiquidity[msg.sender] = block.timestamp;

        _mint(msg.sender, _amount);
    }

    

}

