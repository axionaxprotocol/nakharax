// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JobMarketplaceStandalone
 * @dev Standalone DeAI compute escrow and PoPC settlement contract.
 */
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract JobMarketplaceStandalone {
    struct Worker {
        address addr;
        uint256 stake;
        uint256 reputation;
        uint256 jobsCompleted;
        uint256 jobsFailed;
        bool active;
        uint256 registeredAt;
    }

    struct Job {
        uint256 id;
        address submitter;
        address worker;
        uint8 jobType; // 0=Inference 1=Training 2=DataProcessing 3=Custom
        uint8 status; // 0=Pending 1=Assigned 2=Completed 3=Disputed 4=Cancelled 5=Resolved
        uint256 reward;
        uint256 deposit;
        uint256 timeout;
        uint256 createdAt;
        uint256 assignedAt;
        uint256 completedAt;
        bytes32 inputHash;
        bytes32 resultHash;
        bytes32 proofHash;
    }

    IERC20 public nakToken;
    uint256 public minStake;
    uint256 public platformFeeRate; // basis points (100 = 1 %)
    uint256 public disputePeriod; // seconds
    uint256 public nextJobId;
    address public owner;

    mapping(address => Worker) private _workers;
    mapping(uint256 => Job) private _jobs;
    mapping(address => uint256[]) private _submitterJobs;
    mapping(address => uint256[]) private _workerJobs;
    address[] private _workerList;

    uint256[] private _pendingJobIds;
    mapping(uint256 => uint256) private _pendingIdx;
    bool private _locked;

    event WorkerRegistered(address indexed worker, uint256 stake);
    event WorkerUpdated(address indexed worker, uint256 newStake);
    event WorkerDeactivated(address indexed worker);
    event JobCreated(uint256 indexed jobId, address indexed submitter, uint8 jobType, uint256 reward, bytes32 inputHash);
    event JobAssigned(uint256 indexed jobId, address indexed worker, uint256 assignedAt);
    event JobCompleted(uint256 indexed jobId, address indexed worker, bytes32 resultHash, bytes32 proofHash);
    event JobDisputed(uint256 indexed jobId, address indexed disputer);
    event JobCancelled(uint256 indexed jobId);
    event JobRefunded(uint256 indexed jobId);
    event RewardClaimed(uint256 indexed jobId, address indexed worker, uint256 amount);
    event SlashApplied(address indexed worker, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    modifier onlyActiveWorker() {
        require(_workers[msg.sender].active, "not active worker");
        _;
    }

    constructor(
        address _nakToken,
        uint256 _minStake,
        uint256 _platformFeeRate,
        uint256 _disputePeriod
    ) {
        require(_platformFeeRate <= 10_000, "fee rate > 100%");
        nakToken = IERC20(_nakToken);
        minStake = _minStake;
        platformFeeRate = _platformFeeRate;
        disputePeriod = _disputePeriod;
        owner = msg.sender;
        nextJobId = 1;
    }

    function registerWorker(uint256 stakeAmount) external nonReentrant {
        require(!_workers[msg.sender].active, "already registered");
        require(stakeAmount >= minStake, "stake below min");
        require(nakToken.transferFrom(msg.sender, address(this), stakeAmount), "stake failed");

        _workers[msg.sender] = Worker({
            addr: msg.sender,
            stake: stakeAmount,
            reputation: 100,
            jobsCompleted: 0,
            jobsFailed: 0,
            active: true,
            registeredAt: block.timestamp
        });
        _workerList.push(msg.sender);
        emit WorkerRegistered(msg.sender, stakeAmount);
    }

    function createJob(
        uint8 jobType,
        uint256 reward,
        uint256 timeout,
        bytes32 inputHash
    ) external nonReentrant returns (uint256 jobId) {
        require(reward > 0, "reward must be > 0");
        require(timeout >= 30, "timeout too short");
        uint256 deposit = reward / 10;
        uint256 totalAmount = reward + deposit;
        require(nakToken.transferFrom(msg.sender, address(this), totalAmount), "transfer failed");

        jobId = nextJobId++;
        _jobs[jobId] = Job({
            id: jobId,
            submitter: msg.sender,
            worker: address(0),
            jobType: jobType,
            status: 0,
            reward: reward,
            deposit: deposit,
            timeout: timeout,
            createdAt: block.timestamp,
            assignedAt: 0,
            completedAt: 0,
            inputHash: inputHash,
            resultHash: bytes32(0),
            proofHash: bytes32(0)
        });
        _pendingIdx[jobId] = _pendingJobIds.length;
        _pendingJobIds.push(jobId);
        _submitterJobs[msg.sender].push(jobId);
        emit JobCreated(jobId, msg.sender, jobType, reward, inputHash);
    }

    function assignJob(uint256 jobId) external nonReentrant onlyActiveWorker {
        Job storage job = _jobs[jobId];
        require(job.id != 0, "job not found");
        require(job.status == 0, "not pending");
        job.worker = msg.sender;
        job.status = 1;
        job.assignedAt = block.timestamp;
        _removePending(jobId);
        _workerJobs[msg.sender].push(jobId);
        emit JobAssigned(jobId, msg.sender, block.timestamp);
    }

    function submitResult(
        uint256 jobId,
        bytes32 resultHash,
        bytes32 proofHash
    ) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(job.id != 0, "job not found");
        require(job.worker == msg.sender, "not worker");
        require(job.status == 1, "not assigned");
        require(block.timestamp <= job.assignedAt + job.timeout, "timed out");

        job.resultHash = resultHash;
        job.proofHash = proofHash;
        job.status = 2;
        job.completedAt = block.timestamp;
        _workers[msg.sender].jobsCompleted += 1;
        emit JobCompleted(jobId, msg.sender, resultHash, proofHash);
    }

    function claimReward(uint256 jobId) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(job.id != 0, "job not found");
        require(job.worker == msg.sender, "not worker");
        require(job.status == 2, "not completed");
        require(block.timestamp >= job.completedAt + disputePeriod, "dispute pending");

        uint256 fee = (job.reward * platformFeeRate) / 10_000;
        uint256 workerReward = job.reward - fee;
        job.status = 5;

        require(nakToken.transfer(msg.sender, workerReward), "reward failed");
        require(nakToken.transfer(job.submitter, job.deposit), "deposit failed");
        if (fee > 0) {
            require(nakToken.transfer(owner, fee), "fee failed");
        }
        emit RewardClaimed(jobId, msg.sender, workerReward);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return _jobs[jobId];
    }

    function getPendingJobs() external view returns (uint256[] memory) {
        return _pendingJobIds;
    }

    function _removePending(uint256 jobId) internal {
        uint256 idx = _pendingIdx[jobId];
        uint256 lastId = _pendingJobIds[_pendingJobIds.length - 1];
        _pendingJobIds[idx] = lastId;
        _pendingIdx[lastId] = idx;
        _pendingJobIds.pop();
        delete _pendingIdx[jobId];
    }
}
