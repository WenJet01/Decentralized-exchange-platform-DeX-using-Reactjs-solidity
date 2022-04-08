var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var SbToken = artifacts.require("./Sbtoken.sol");
var pool = artifacts.require("./pool.sol");
var LpToken = artifacts.require("./LpToken.sol");


module.exports = async function(deployer) {
  await deployer.deploy(SbToken);
  const token = await SbToken.deployed();

  await deployer.deploy(SimpleStorage);

  await deployer.deploy(pool,token.address);
  const Pool = await pool.deployed();

  await deployer.deploy(LpToken);
};
