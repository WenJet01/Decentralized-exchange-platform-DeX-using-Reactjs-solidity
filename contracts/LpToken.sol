// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract LpToken {
    struct Lp {
        uint providedEth;
        uint providedSbt;
        uint reward;
    }

    mapping(address => Lp) public data;
    address[] public liqProviders;

    function create(address _add, uint eth, uint sbt) public {
        data[_add] = Lp(eth, sbt, 0);
        liqProviders.push(_add);
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
        bool found = false;
        delete data[_add];

        for(uint i=0 ;i < liqProviders.length; i++){
            if(liqProviders[i] == _add){
                for(uint j=i ;j < liqProviders.length; j++){
                    
                    if(j+1 == liqProviders.length){
                        liqProviders.pop();
                    }else{
                        liqProviders[j] = liqProviders[j+1];
                    }

                }
                found = true;
            }

            if(found){
                break;
            }
            
        }
        
    }

    function getArray()public view returns(address[] memory){
        return liqProviders;
    }
}
