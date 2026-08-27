// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TokenVesting
 * @dev Cryptographic Linear Token Vesting & Lockup Contract for NakharaX Protocol ($NAK).
 * Enforces on-chain vesting schedules with configurable cliff duration and linear release.
 * Strictly non-custodial and protected against reentrancy.
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract TokenVesting {
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 totalDuration;
        bool revocable;
        bool revoked;
    }

    IERC20 public immutable token;
    address public owner;
    bool private _locked;

    bytes32[] private _scheduleIds;
    mapping(bytes32 => VestingSchedule) private _schedules;
    mapping(address => bytes32[]) private _beneficiarySchedules;
    uint256 public totalAllocated;

    event ScheduleCreated(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 totalDuration,
        bool revocable
    );
    event TokensReleased(bytes32 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event ScheduleRevoked(bytes32 indexed scheduleId, address indexed beneficiary, uint256 unreleasedAmount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "TokenVesting: caller is not the owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "TokenVesting: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "TokenVesting: token address cannot be zero");
        token = IERC20(tokenAddress);
        owner = msg.sender;
    }

    /**
     * @notice Creates a new linear vesting schedule for a beneficiary.
     * @param beneficiary The address that will receive released tokens.
     * @param totalAmount Total number of tokens locked in schedule.
     * @param startTime Timestamp when vesting calculation begins.
     * @param cliffDuration Seconds after startTime before any tokens become claimable.
     * @param totalDuration Total seconds from startTime until 100% of tokens are unlocked.
     * @param revocable Whether the owner has permission to revoke unvested tokens.
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 totalDuration,
        bool revocable
    ) external onlyOwner nonReentrant returns (bytes32 scheduleId) {
        require(beneficiary != address(0), "TokenVesting: beneficiary cannot be zero");
        require(totalAmount > 0, "TokenVesting: amount must be > 0");
        require(totalDuration > 0, "TokenVesting: duration must be > 0");
        require(totalDuration >= cliffDuration, "TokenVesting: duration must be >= cliff");

        // Transfer tokens from creator into vesting contract
        require(
            token.transferFrom(msg.sender, address(this), totalAmount),
            "TokenVesting: token transfer failed"
        );

        scheduleId = keccak256(
            abi.encodePacked(
                beneficiary,
                totalAmount,
                startTime,
                _scheduleIds.length,
                block.timestamp
            )
        );

        _schedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: startTime,
            cliffDuration: cliffDuration,
            totalDuration: totalDuration,
            revocable: revocable,
            revoked: false
        });

        _scheduleIds.push(scheduleId);
        _beneficiarySchedules[beneficiary].push(scheduleId);
        totalAllocated += totalAmount;

        emit ScheduleCreated(
            scheduleId,
            beneficiary,
            totalAmount,
            startTime,
            cliffDuration,
            totalDuration,
            revocable
        );
    }

    /**
     * @notice Releases vested tokens to the beneficiary.
     */
    function release(bytes32 scheduleId) external nonReentrant returns (uint256) {
        VestingSchedule storage schedule = _schedules[scheduleId];
        require(schedule.beneficiary != address(0), "TokenVesting: schedule does not exist");
        require(!schedule.revoked, "TokenVesting: schedule is revoked");

        uint256 vested = _computeVestedAmount(schedule);
        uint256 claimable = vested - schedule.releasedAmount;
        require(claimable > 0, "TokenVesting: no tokens due for release");

        schedule.releasedAmount += claimable;
        totalAllocated -= claimable;

        require(
            token.transfer(schedule.beneficiary, claimable),
            "TokenVesting: token release transfer failed"
        );

        emit TokensReleased(scheduleId, schedule.beneficiary, claimable);
        return claimable;
    }

    /**
     * @notice Computes the claimable tokens for a given schedule at current timestamp.
     */
    function getClaimableAmount(bytes32 scheduleId) external view returns (uint256) {
        VestingSchedule memory schedule = _schedules[scheduleId];
        if (schedule.beneficiary == address(0) || schedule.revoked) {
            return 0;
        }
        uint256 vested = _computeVestedAmount(schedule);
        return vested - schedule.releasedAmount;
    }

    /**
     * @notice Revokes a revocable schedule, paying out any vested tokens to beneficiary and returning unvested to owner.
     */
    function revoke(bytes32 scheduleId) external onlyOwner nonReentrant {
        VestingSchedule storage schedule = _schedules[scheduleId];
        require(schedule.beneficiary != address(0), "TokenVesting: schedule does not exist");
        require(schedule.revocable, "TokenVesting: schedule is non-revocable");
        require(!schedule.revoked, "TokenVesting: schedule already revoked");

        uint256 vested = _computeVestedAmount(schedule);
        uint256 claimable = vested - schedule.releasedAmount;
        uint256 unvested = schedule.totalAmount - vested;

        schedule.revoked = true;
        totalAllocated -= (claimable + unvested);

        // Payout claimable to beneficiary
        if (claimable > 0) {
            schedule.releasedAmount += claimable;
            require(token.transfer(schedule.beneficiary, claimable), "TokenVesting: release to beneficiary failed");
            emit TokensReleased(scheduleId, schedule.beneficiary, claimable);
        }

        // Return unvested tokens to owner
        if (unvested > 0) {
            require(token.transfer(owner, unvested), "TokenVesting: unvested refund to owner failed");
        }

        emit ScheduleRevoked(scheduleId, schedule.beneficiary, unvested);
    }

    function getSchedule(bytes32 scheduleId) external view returns (VestingSchedule memory) {
        return _schedules[scheduleId];
    }

    function getSchedulesByBeneficiary(address beneficiary) external view returns (bytes32[] memory) {
        return _beneficiarySchedules[beneficiary];
    }

    function getScheduleCount() external view returns (uint256) {
        return _scheduleIds.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TokenVesting: new owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function _computeVestedAmount(VestingSchedule memory schedule) internal view returns (uint256) {
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        } else if (block.timestamp >= schedule.startTime + schedule.totalDuration) {
            return schedule.totalAmount;
        } else {
            uint256 timeFromStart = block.timestamp - schedule.startTime;
            return (schedule.totalAmount * timeFromStart) / schedule.totalDuration;
        }
    }
}
