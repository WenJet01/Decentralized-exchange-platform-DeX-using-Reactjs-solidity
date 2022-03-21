const SbToken = artifacts.require("./../contracts/SbToken.sol");
const Pool = artifacts.require("./../contracts/pool.sol");

function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

contract("pool", accounts => {
  let token, pool

  before(async () => {
    token = await SbToken.new()
    pool = await Pool.new(token.address)
   
    
  })

  describe('Token deployment', async () => {
    it('Sbtoken is set in pool', async () => {
      const add = await pool.sbt()
      assert.equal(add, token.address)
    })
  })

  describe('buyTokens()', async () => {
    let result

    before(async () => {
      // Purchase tokens before each example
      await token.approve(pool.address,tokens('5'))
      result = await pool.settingUp( tokens('2'), {from: accounts[0], value:tokens('3')})
    })

    // it('view vareiables', async () => {
    //   const hi = await pool.allowance()
    //   assert.equal(hi, '0')
    //   const fi = await pool.approved()
    //   assert.equal(fi, 'true')
    // })

    it('Gam balance after setting up', async () => {
      // Check investor token balance after purchase
      // let investorBalance = await token.balanceOf(investor)
      // assert.equal(investorBalance.toString(), tokens('100'))

      // Check ethSwap balance after purchase
      
      const sbtBalance = await pool.sbtBalance();
      assert.equal(sbtBalance.toString(), tokens('2'))

      const ethBalance = await pool.getBalanceEth();
      assert.equal(ethBalance.toString(), tokens('3'))
      //ethSwapBalance = await web3.eth.getBalance(pool.address)
      //assert.equal(ethSwapBalance.toString(), tokens('0'))

      // const event = result.logs[0].args
      // assert.equal(event.account, investor)
      // assert.equal(event.token, token.address)
      // assert.equal(event.amount.toString(), tokens('100').toString())
      // assert.equal(event.rate.toString(), '100')
    })
  })
});
