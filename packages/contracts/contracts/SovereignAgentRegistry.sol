// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SovereignAgentRegistry
 * @dev Autonomous Agent DID registry and state channel micro-escrow.
 */
contract SovereignAgentRegistry {
    struct Agent {
        string did;
        string name;
        address owner;
        uint256 balance;
        uint256 reputation;
        string[] equippedSkills;
        uint256 totalJobsExecuted;
        uint256 createdAt;
        bool active;
    }

    mapping(string => Agent) public agents;
    string[] public agentDids;

    event AgentMinted(string indexed did, address indexed owner, string name, uint256 balance);
    event AgentSkillEquipped(string indexed did, string skillId);
    event AgentExecutedJob(string indexed did, uint256 feeEarned);

    function mintAgent(
        string calldata did,
        string calldata name,
        string[] calldata initialSkills
    ) external payable {
        require(bytes(did).length > 0, "Empty DID");
        require(agents[did].createdAt == 0, "Agent already exists");

        agents[did] = Agent({
            did: did,
            name: name,
            owner: msg.sender,
            balance: msg.value,
            reputation: 100,
            equippedSkills: initialSkills,
            totalJobsExecuted: 0,
            createdAt: block.timestamp,
            active: true
        });

        agentDids.push(did);
        emit AgentMinted(did, msg.sender, name, msg.value);
    }

    function equipSkill(string calldata did, string calldata skillId) external {
        require(agents[did].owner == msg.sender, "Not agent owner");
        agents[did].equippedSkills.push(skillId);
        emit AgentSkillEquipped(did, skillId);
    }

    function getAgentCount() external view returns (uint256) {
        return agentDids.length;
    }
}
