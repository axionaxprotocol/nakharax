// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title FaucetTreasury
 * @dev Rate-limited testnet faucet distributing 100 tNAK per cooldown period.
 */
contract FaucetTreasury {
    IERC20 public nakToken;
    address public admin;
    uint256 public dispenseAmount = 100 * 10**18; // 100 tNAK
    uint256 public cooldownTime = 12 hours;

    mapping(address => uint256) public lastDispenseTime;

    event TokensDispensed(address indexed recipient, uint256 amount, uint256 timestamp);
    event CooldownUpdated(uint256 newCooldown);
    event DispenseAmountUpdated(uint256 newAmount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(address _tokenAddress) {
        admin = msg.sender;
        nakToken = IERC20(_tokenAddress);
    }

    function requestTokens() external {
        require(
            block.timestamp >= lastDispenseTime[msg.sender] + cooldownTime,
            "Cooldown active: please wait before requesting again"
        );
        require(nakToken.balanceOf(address(this)) >= dispenseAmount, "Faucet treasury empty");

        lastDispenseTime[msg.sender] = block.timestamp;
        require(nakToken.transfer(msg.sender, dispenseAmount), "Transfer failed");

        emit TokensDispensed(msg.sender, dispenseAmount, block.timestamp);
    }

    function setCooldown(uint256 _newCooldown) external onlyAdmin {
        cooldownTime = _newCooldown;
        emit CooldownUpdated(_newCooldown);
    }

    function setDispenseAmount(uint256 _newAmount) external onlyAdmin {
        dispenseAmount = _newAmount;
        emit DispenseAmountUpdated(_newAmount);
    }

    function emergencyWithdraw(address _to, uint256 _amount) external onlyAdmin {
        nakToken.transfer(_to, _amount);
    }
}
