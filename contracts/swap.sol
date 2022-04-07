// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import "./pool.sol";
import "./SbToken.sol";

contract swap {
    SbToken public sbt;
    pool public pl;

    address payable user;
    uint256 public totalTokenEth = 1000000000000000000;
    uint256 public totalTokenSb = 10000000000000000000;

    bool run = true;
    uint256 k;

    string public functionCalled;

    //mapping (address => uint) balances;

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    constructor(SbToken _sbToken) {
        sbt = _sbToken;
        user = payable(msg.sender);
        k = totalTokenEth * totalTokenSb;
    }

    modifier checkPool() {
        require(run);
        _;
    }

    modifier checkBalance() {
        require(msg.value > 0);
        require(msg.value <= user.balance);
        _;
    }

    // function calculateConstant() public{
    //    k = totalTokenEth * totalTokenSb;
    // }

    //check is pool runnning
    function getSwapTokenSbEstimate(uint256 _amountTokenEth) public view checkPool returns (uint256 estimateTokenSb)
    {
        uint256 tokenEthAfter = totalTokenEth + _amountTokenEth;

        return totalTokenSb - (k / tokenEthAfter);
    }

    function getSwapTokenEthEstimate(uint256 _amountTokenSb)public view checkPool returns (uint256 estimateTokenEth)
    {
        uint256 tokenSbAfter = totalTokenSb + _amountTokenSb;

        return totalTokenEth - (k / tokenSbAfter);
    }

    //need to check balance
    function tokenEthSwapTokenSb() external checkBalance payable{
        
        payable(address(this)).transfer(msg.value);

        sbt.approve(user, msg.value);
        sbt.transferFrom(user, address(this), msg.value);

        functionCalled = "transfer";
    }

    function tokenSbSwapTokenEth(uint256 _amountTokenSb) public view {
        // uint amountTokenEth = getSwapTokenEthEstimate(_amountTokenSb);
        //transfer
    }
}
