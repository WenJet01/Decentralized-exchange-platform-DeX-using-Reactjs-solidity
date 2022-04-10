// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract LpToken {
    uint public totalSupply;

    struct providers{
        uint token;
        uint reward;
    }
    mapping(address => providers) public data;
    

// babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function calcLp(uint sbtProvided, uint totalSbt) public view returns(uint){
        return(totalSupply*sbtProvided)/totalSbt;      
    }

    function addSupply(uint supply)public{
        totalSupply = sqrt(supply);
    }

    function get(address _add)public view returns (uint){
        return data[_add].token;
    }

    function update(address _add, uint sbtProvided, uint totalSbt) public {
        uint lp = calcLp( sbtProvided, totalSbt);
        data[_add].token += lp;

    }

    function minus(address _add, uint lpToken) public {
        data[_add].token -= lpToken;

    }

    
}
