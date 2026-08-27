// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PoPCStakingPool
 * @dev Cryptographic Liquid Staking & Validator Delegation Pool for NakharaX Protocol ($NAK).
 * Users stake $tNAK, receive liquid $sNAK, accrue PoPC consensus yield (8.4% APY),
 * and can delegate to active network validators with unbonding cooldown protection.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PoPCStakingPool {
    struct Validator {
        address addr;
        uint256 totalDelegated;
        uint256 commissionRate; // basis points (500 = 5%)
        bool active;
        uint256 registeredAt;
    }

    struct UnbondingRequest {
        uint256 amount;
        uint256 releaseTime;
        bool claimed;
    }

    IERC20 public immutable stakingToken; // $tNAK
    string public name = "Staked NakharaX";
    string public symbol = "sNAK";
    uint8 public decimals = 18;

    address public owner;
    bool private _locked;

    uint256 public totalStaked;
    uint256 public totalShares; // $sNAK shares
    uint256 public unbondingPeriod; // Cooldown in seconds (e.g. 7 days mainnet / 300s testnet)
    uint256 public minStakeAmount;

    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userDelegation; // staker => validator
    mapping(address => address) public delegatedValidator; // staker => validator address
    mapping(address => Validator) private _validators;
    address[] private _validatorList;

    mapping(address => UnbondingRequest[]) private _unbondingRequests;

    event Staked(address indexed user, address indexed validator, uint256 amount, uint256 sharesMinted);
    event UnbondingInitiated(address indexed user, uint256 amount, uint256 releaseTime);
    event UnstakedClaimed(address indexed user, uint256 amount);
    event RewardsInjected(uint256 amount, uint256 newTotalStaked);
    event ValidatorRegistered(address indexed validator, uint256 commissionRate);
    event ValidatorSlashed(address indexed validator, uint256 slashedAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "PoPCStakingPool: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "PoPCStakingPool: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(
        address _stakingToken,
        uint256 _unbondingPeriod,
        uint256 _minStakeAmount
    ) {
        require(_stakingToken != address(0), "PoPCStakingPool: zero token address");
        stakingToken = IERC20(_stakingToken);
        unbondingPeriod = _unbondingPeriod;
        minStakeAmount = _minStakeAmount;
        owner = msg.sender;
    }

    /**
     * @notice Register a new consensus validator node in the staking pool.
     */
    function registerValidator(address validatorAddr, uint256 commissionRate) external onlyOwner {
        require(validatorAddr != address(0), "PoPCStakingPool: zero validator address");
        require(commissionRate <= 3000, "PoPCStakingPool: commission > 30%");
        require(!_validators[validatorAddr].active, "PoPCStakingPool: already registered");

        _validators[validatorAddr] = Validator({
            addr: validatorAddr,
            totalDelegated: 0,
            commissionRate: commissionRate,
            active: true,
            registeredAt: block.timestamp
        });
        _validatorList.push(validatorAddr);
        emit ValidatorRegistered(validatorAddr, commissionRate);
    }

    /**
     * @notice Stakes $tNAK, delegates to a validator, and mints liquid $sNAK shares.
     */
    function stake(uint256 amount, address validatorAddr) external nonReentrant returns (uint256 shares) {
        require(amount >= minStakeAmount, "PoPCStakingPool: below min stake");
        require(validatorAddr == address(0) || _validators[validatorAddr].active, "PoPCStakingPool: invalid validator");

        // Calculate shares to mint
        if (totalShares == 0 || totalStaked == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalStaked;
        }

        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "PoPCStakingPool: transfer failed"
        );

        userShares[msg.sender] += shares;
        totalShares += shares;
        totalStaked += amount;

        if (validatorAddr != address(0)) {
            delegatedValidator[msg.sender] = validatorAddr;
            _validators[validatorAddr].totalDelegated += amount;
        }

        emit Staked(msg.sender, validatorAddr, amount, shares);
    }

    /**
     * @notice Initiates unbonding of $sNAK shares with unbonding cooldown period.
     */
    function initiateUnbonding(uint256 shareAmount) external nonReentrant returns (uint256 tNakAmount) {
        require(shareAmount > 0, "PoPCStakingPool: zero shares");
        require(userShares[msg.sender] >= shareAmount, "PoPCStakingPool: insufficient shares");

        // Convert shares to underlying $tNAK value (including accrued yield)
        tNakAmount = (shareAmount * totalStaked) / totalShares;

        userShares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalStaked -= tNakAmount;

        // Reduce delegation if any
        address val = delegatedValidator[msg.sender];
        if (val != address(0) && _validators[val].totalDelegated >= tNakAmount) {
            _validators[val].totalDelegated -= tNakAmount;
        }

        uint256 releaseTime = block.timestamp + unbondingPeriod;
        _unbondingRequests[msg.sender].push(UnbondingRequest({
            amount: tNakAmount,
            releaseTime: releaseTime,
            claimed: false
        }));

        emit UnbondingInitiated(msg.sender, tNakAmount, releaseTime);
    }

    /**
     * @notice Claims all mature unbonded $tNAK tokens after cooldown has expired.
     */
    function claimUnbonded() external nonReentrant returns (uint256 totalClaimed) {
        UnbondingRequest[] storage requests = _unbondingRequests[msg.sender];
        require(requests.length > 0, "PoPCStakingPool: no unbonding requests");

        for (uint256 i = 0; i < requests.length; i++) {
            if (!requests[i].claimed && block.timestamp >= requests[i].releaseTime) {
                requests[i].claimed = true;
                totalClaimed += requests[i].amount;
            }
        }

        require(totalClaimed > 0, "PoPCStakingPool: no unlocked tokens ready");
        require(
            stakingToken.transfer(msg.sender, totalClaimed),
            "PoPCStakingPool: claim transfer failed"
        );

        emit UnstakedClaimed(msg.sender, totalClaimed);
    }

    /**
     * @notice Injects PoPC consensus mining rewards into the pool, increasing $sNAK exchange rate.
     */
    function injectPoPCRewards(uint256 rewardAmount) external onlyOwner nonReentrant {
        require(rewardAmount > 0, "PoPCStakingPool: zero reward");
        require(
            stakingToken.transferFrom(msg.sender, address(this), rewardAmount),
            "PoPCStakingPool: reward transfer failed"
        );

        totalStaked += rewardAmount;
        emit RewardsInjected(rewardAmount, totalStaked);
    }

    /**
     * @notice Applies slashing penalty to a misbehaving validator node.
     */
    function slashValidator(address validatorAddr, uint256 slashBps) external onlyOwner nonReentrant {
        require(_validators[validatorAddr].active, "PoPCStakingPool: validator not active");
        require(slashBps <= 10000, "PoPCStakingPool: slash > 100%");

        uint256 delegated = _validators[validatorAddr].totalDelegated;
        uint256 slashedAmount = (delegated * slashBps) / 10000;

        if (slashedAmount > totalStaked) {
            slashedAmount = totalStaked;
        }

        totalStaked -= slashedAmount;
        _validators[validatorAddr].totalDelegated -= slashedAmount;
        if (slashBps >= 5000) {
            _validators[validatorAddr].active = false;
        }

        emit ValidatorSlashed(validatorAddr, slashedAmount);
    }

    /**
     * @notice Returns total underlying $tNAK balance for a user's $sNAK shares.
     */
    function getUnderlyingBalance(address user) external view returns (uint256) {
        if (totalShares == 0 || userShares[user] == 0) {
            return 0;
        }
        return (userShares[user] * totalStaked) / totalShares;
    }

    function getUnbondingRequests(address user) external view returns (UnbondingRequest[] memory) {
        return _unbondingRequests[user];
    }

    function getValidator(address validatorAddr) external view returns (Validator memory) {
        return _validators[validatorAddr];
    }

    function getValidatorList() external view returns (address[] memory) {
        return _validatorList;
    }

    function setUnbondingPeriod(uint256 newPeriod) external onlyOwner {
        unbondingPeriod = newPeriod;
    }
}
