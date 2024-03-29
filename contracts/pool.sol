// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

import "./SbToken.sol";
import "./LpToken.sol";

contract pool {
    SbToken public sbt;
    LpToken public lp;
    uint256 private immutable feesRate = 3;
    uint256 private immutable feesDecimal = 1000;
    //uint public ethBalance;
    address public owner;
    uint256 public sbtBalance = 0; //sbt available to use & calculate
    uint256 private sbtReserved = 0; //sbt reserved for liquidity provider reward
    bool public isRunning = false;

    uint public k;
    uint estimateTokenSb;
    uint estimateTokenEth;
    uint public sbtGet =0;


    //addDeposit variable
    uint256 public sbtRatio;
    uint256 public ethRatio;

    event PoolInitialised(
        address account,
        address token,
        uint256 amountSbt,
        uint256 amountEth
    );

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner is allowed for this action.");
        _;
    }

    modifier checkPool() {
        require(isRunning);
        _;
    }

    modifier checkBalance() {
        require(msg.value > 0);
        require(msg.value <= msg.sender.balance);
        _;
    }

    modifier checkBalance2(uint256 amountSbt) {
        require(amountSbt > 0);
        require(amountSbt <= sbt.balanceOf(msg.sender));
        _;
    }

    constructor(SbToken _sbToken, LpToken _lpToken) {
        sbt = _sbToken;
        lp = _lpToken;
        owner = msg.sender;
    }

    //deploy the pool by owner
    function settingUp(uint256 sbtSupply) public payable onlyOwner {
        sbt.transferFrom(msg.sender, payable(this), sbtSupply);
        //payable(address(this)).transfer(msg.value);

        //require(msg.sender == owner, "Only owner can deploy the pool.");
        sbtBalance += sbtSupply;
        calculateConstant();
        isRunning = true;
        lp.addSupply(k);

        emit PoolInitialised(msg.sender, address(sbt), sbtSupply, msg.value);

    }

    //get the 99.7% of sbt (used for swap)
    function getActualSbt(uint256 fullSbt) internal pure returns (uint256) {
        return (fullSbt * (feesDecimal - feesRate)) / feesDecimal;
    }

    //get the 0.3% fees of sbt (swap)(if giving eth, convert reserved eth to sbt)
    function getReservedSbt(uint256 fullSbt) internal pure returns (uint256) {
        return (fullSbt * feesRate) / feesDecimal;
    }

    function getBalanceEth() public view returns (uint256) {
        return address(this).balance;
    }

    



    //swap
    function calculateConstant() internal{
        k = address(this).balance * sbtBalance;
    }

    function getSwapTokenSbEstimate(uint256 _amountTokenEth)
        public
        checkPool
        returns (uint256, uint256)
    {
        uint tokenEthAfter = address(this).balance + _amountTokenEth;
        
        estimateTokenSb = sbtBalance - (k / tokenEthAfter);
        sbtGet = getActualSbt(estimateTokenSb);
        return (estimateTokenSb, sbtGet);
    }

    function getSwapTokenEthEstimate(uint256 _amountTokenSb)
        public
        checkPool
        returns (uint256)
    {
        uint256 tokenSbAfter = sbtBalance + getActualSbt(_amountTokenSb);
        
        estimateTokenEth = address(this).balance - (k / tokenSbAfter);
        return (estimateTokenEth);
    }

    function getEthNeed(uint256 _amountSbt)
        public
        checkPool
        returns (uint256, uint256)
    {
        uint256 tokenSbtAfter = sbtBalance - _amountSbt;
        
        uint256 ethNeed = (k / tokenSbtAfter) - address(this).balance;
        sbtGet = getActualSbt(_amountSbt);
        return (ethNeed, sbtGet);
    }

    function getSbtNeed(uint256 _amountEth) public view checkPool returns (uint256) {
        uint256 tokenEthAfter = address(this).balance - _amountEth;
        
        uint256 sbtNeed = (k / tokenEthAfter) - sbtBalance;
        uint256 actual = sbtNeed + getReservedSbt(sbtNeed);
        return (actual);
    }

    function tokenEthSwapTokenSb(uint256 amountSbt, uint256 getAmount)
        external
        payable
        checkBalance
    {
        sbtReserved += getReservedSbt(amountSbt);
        //calcReward(getReservedSbt(amountSbt));
        payable(address(this)).transfer(msg.value);
        sbt.transfer(msg.sender, getAmount);
        sbtBalance -= amountSbt;
    }

    function tokenSbSwapTokenEth(uint256 amountSbt, uint256 amountEth)
        public
        checkBalance2(amountSbt)
    {
        sbtReserved += getReservedSbt(amountSbt);
        //calcReward(getReservedSbt(amountSbt));
        sbt.transferFrom(msg.sender, address(this), amountSbt);
        payable(msg.sender).transfer(amountEth);
        sbtBalance += getActualSbt(amountSbt);
    }

    //addDeposit
    function calSBT(uint ethAmount) public checkPool returns(uint returnSBT){

        sbtRatio = ((sbtBalance)*10**18/(address(this).balance));
        return ethAmount * sbtRatio;
    }

    function calETH(uint sbtAmount) public checkPool returns(uint returnETH){
        ethRatio = ((address(this).balance) *10**18) /sbtBalance;
        return sbtAmount * ethRatio;
    }

    function deposit(uint256 sbtDeposit) external payable {
        payable(address(this)).transfer(msg.value);
        sbt.transferFrom(msg.sender, address(this), sbtDeposit);
        sbtBalance += sbtDeposit;
        calculateConstant();
        lp.addSupply(k);
        lp.update(msg.sender, sbtDeposit, sbtBalance);
        
    }

    //withdraw
    function getAmountWithdraw(address sender)public view returns(uint lpToken, uint sbtWithdraw, uint ethWithdraw, uint sbtReward){
        lpToken = lp.get(sender);

        sbtWithdraw = (sbtBalance*lpToken)/lp.totalSupply();
        ethWithdraw = (address(this).balance*lpToken)/lp.totalSupply();
        sbtReward = (sbtReserved*lpToken)/lp.totalSupply();

    }

    function withdrawLiquity(
        uint256 percent

    ) external payable {

        (uint lpToken, uint sbtAvailable, uint ethAvailable, uint rewardAvailable) = getAmountWithdraw(msg.sender);

        uint256 sbtWithdraw = ((sbtAvailable * percent)/100) +
            ((rewardAvailable * percent)/100);
        //SBT
        sbt.transfer(payable(msg.sender), sbtWithdraw);
        sbtBalance -= ((sbtAvailable * percent)/100);
        sbtReserved -= ((rewardAvailable * percent)/100);
        //ETH
        uint256 withdrawETH = ((ethAvailable * percent) / 100);
        payable(msg.sender).transfer(withdrawETH);

        calculateConstant();
        lp.addSupply(k);
        lp.minus(msg.sender, ((lpToken*percent)/100) );
    }


    
}
