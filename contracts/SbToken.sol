// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract SbToken is ERC20 {
    constructor() ERC20("SbToken", "SBT") {
        _mint(msg.sender, 100000 * 10**18);
        _mint(0xd9E21051074B583fE51A3AB70a8bc9Da0b324356, 100000 * 10**18);
        _mint(0x9B8EA7c185BCfBB2Ee639fD5Ef1998790520cCca, 100000 * 10**18);
        _mint(0x0640414Fe9db47f4bcB1B6b7b7FAE42148bD37F5, 100000 * 10**18);
    }

}