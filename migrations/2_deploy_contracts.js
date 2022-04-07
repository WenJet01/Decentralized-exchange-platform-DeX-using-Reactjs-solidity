var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var SbToken = artifacts.require("./Sbtoken.sol");
var pool = artifacts.require("./pool.sol");
var LpToken = artifacts.require("./LpToken.sol");
var swap = artifacts.require("./swap.sol");


module.exports = function(deployer) {
  deployer.deploy(SbToken);
  deployer.deploy(SimpleStorage);
  deployer.deploy(pool,SbToken.address);
  deployer.deploy(LpToken);
  deployer.deploy(swap,SbToken.address);
};
