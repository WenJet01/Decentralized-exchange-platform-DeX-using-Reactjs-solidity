// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;



contract LpToken {
    

    struct Lp{
        uint providedEth;
        uint providedSbt;
        uint reward;
    }

    mapping(address => Lp) public data;
    
    
}