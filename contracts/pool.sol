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

    uint256 k;
    uint256 estimateTokenSb;
    uint256 estimateTokenEth;
    uint256 public sbtGet = 0;
    bool oneTime = true;

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

    function settingUp(uint256 sbtSupply) public payable onlyOwner {
        sbt.transferFrom(msg.sender, payable(this), sbtSupply);
        //payable(address(this)).transfer(msg.value);

        //require(msg.sender == owner, "Only owner can deploy the pool.");
        sbtBalance += sbtSupply;
        isRunning = true;

        //emit PoolInitialised(msg.sender, address(sbt), sbtSupply, msg.value);

        lp.create(msg.sender, msg.value, sbtSupply);
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

    function withdrawLiquity(
        uint256 percent,
        uint256 providedSBT,
        uint256 providedETH,
        uint256 reward
    ) external payable {
        // require(msg.sender == owner, "Only owner can withdraw funds");
        // require(amount <= balance[destAddr], "Insufficient funds");

        uint256 sbtWithdraw = ((((providedSBT * percent) / 10) +
            (reward * 10)) * 10**18) / 10**18;
        //SBT
        sbt.transfer(payable(msg.sender), sbtWithdraw);
        sbtBalance -= sbtWithdraw;
        //ETH
        uint256 withdrawETH = (((providedETH * percent) / 1000) * 10**18) /
            10**18;
        payable(msg.sender).transfer(withdrawETH);

        oneTime = true;
        calculateConstant();
        lp.minus(msg.sender, withdrawETH, sbtWithdraw);
    }

    function isPoolRunning() public view returns (bool) {
        return isRunning;
    }

    //swap
    function calculateConstant() internal {
        if (oneTime) {
            k = address(this).balance * sbtBalance;
            oneTime = false;
        }
    }

    function getSwapTokenSbEstimate(uint256 _amountTokenEth)
        public
        checkPool
        returns (uint256, uint256)
    {
        uint256 tokenEthAfter = address(this).balance + _amountTokenEth;
        calculateConstant();
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
        calculateConstant();
        estimateTokenEth = address(this).balance - (k / tokenSbAfter);
        return (estimateTokenEth);
    }

    function getEthNeed(uint256 _amountSbt)
        public
        checkPool
        returns (uint256, uint256)
    {
        uint256 tokenSbtAfter = sbtBalance - _amountSbt;
        calculateConstant();
        uint256 ethNeed = (k / tokenSbtAfter) - address(this).balance;
        sbtGet = getActualSbt(_amountSbt);
        return (ethNeed, sbtGet);
    }

    function getSbtNeed(uint256 _amountEth) public checkPool returns (uint256) {
        uint256 tokenEthAfter = address(this).balance - _amountEth;
        calculateConstant();
        uint256 sbtNeed = (k / tokenEthAfter) - sbtBalance;
        uint256 actual = sbtNeed + getReservedSbt(sbtNeed);
        return (actual);
    }

    function tokenEthSwapTokenSb(uint256 amountSbt, uint256 getAmount)
        external
        payable
        checkBalance
    {
        sbtReserved = getReservedSbt(amountSbt);
        payable(address(this)).transfer(msg.value);
        sbt.transfer(msg.sender, getAmount);
        sbtBalance -= getAmount;
    }

    function tokenSbSwapTokenEth(uint256 amountSbt, uint256 amountEth)
        public
        checkBalance2(amountSbt)
    {
        sbtReserved = getReservedSbt(amountSbt);
        sbt.transferFrom(msg.sender, address(this), amountSbt);
        payable(msg.sender).transfer(amountEth);
        sbtBalance += getActualSbt(amountSbt);
    }

    //addDeposit
    function calSBT(uint256 ethAmount)
        public
        checkPool
        returns (uint256 returnSBT)
    {
        sbtRatio = ((sbtBalance / (address(this).balance)) * 10**18);
        return ethAmount * sbtRatio;
    }

    function calETH(uint256 sbtAmount)
        public
        checkPool
        returns (uint256 returnETH)
    {
        ethRatio = (((address(this).balance) * 10**18) / sbtBalance);
        return sbtAmount * ethRatio;
    }

    function deposit(uint256 sbtDeposit) external payable {
        payable(address(this)).transfer(msg.value);
        sbt.transferFrom(msg.sender, address(this), sbtDeposit);
        sbtBalance += sbtDeposit;
        oneTime = true;
        calculateConstant();
    }
}
