// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract LpToken {
    struct Lp {
        uint providedEth;
        uint providedSbt;
        uint reward;
    }

    mapping(address => Lp) public data;

    function create(address _add, uint eth, uint sbt) public {
        data[_add] = Lp(eth, sbt, 0);
    }

    function get(address _add)public view returns (Lp memory){
        return data[_add];
    }

    function update(address _add, uint eth, uint sbt) public {
        data[_add].providedEth += eth;
        data[_add].providedSbt += sbt;

    }

    function minus(address _add, uint eth, uint sbt) public {
        data[_add].providedEth -= eth;
        data[_add].providedSbt -= sbt;

    }

    function addReward(address _add, uint reward)public {
        data[_add].reward += reward;
    }

    function del(address _add)public {
        delete data[_add];
    }
}
