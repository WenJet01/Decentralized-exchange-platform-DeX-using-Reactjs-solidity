//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SBtokenFactory.sol";
import "./SbToken.sol";

contract Deposit{
    
    uint public constant MINIMUM_LIQUIDITY = 10**3;

    address public factory;
    SbToken public stToken;
    address public eth;

    event Mint(address indexed sender, uint amountA, uint amountB);

    constructor(){
        factory = msg.sender;
    }

    function mintFee(uint _reserveA, uint _reserveB) private returns (bool feeOn){
        address feeTo = SBtokenFactory(factory).feeTo();
        feeOn = feeTo != address(0);
        
    }

}