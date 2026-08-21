// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LoRAAdapterHub
 * @dev On-chain registry for decentralized LoRA adapters and TIES/DARE Merkle proof roots.
 */
contract LoRAAdapterHub {
    struct Adapter {
        string adapterId;
        string name;
        string baseModel;
        bytes32 merkleRoot;
        address author;
        uint256 totalMerges;
        uint256 createdAt;
    }

    mapping(string => Adapter) public adapters;
    string[] public adapterIds;

    event AdapterRegistered(string indexed adapterId, string baseModel, bytes32 merkleRoot, address indexed author);
    event AdaptersMerged(string baseModel, string algorithm, bytes32 mergedStateRoot, address indexed operator);

    function registerAdapter(
        string calldata adapterId,
        string calldata name,
        string calldata baseModel,
        bytes32 merkleRoot
    ) external {
        require(bytes(adapterId).length > 0, "Empty ID");
        require(adapters[adapterId].createdAt == 0, "Adapter exists");

        adapters[adapterId] = Adapter({
            adapterId: adapterId,
            name: name,
            baseModel: baseModel,
            merkleRoot: merkleRoot,
            author: msg.sender,
            totalMerges: 0,
            createdAt: block.timestamp
        });

        adapterIds.push(adapterId);
        emit AdapterRegistered(adapterId, baseModel, merkleRoot, msg.sender);
    }

    function recordMerge(
        string calldata baseModel,
        string calldata algorithm,
        bytes32 mergedStateRoot
    ) external payable {
        emit AdaptersMerged(baseModel, algorithm, mergedStateRoot, msg.sender);
    }

    function getAdapterCount() external view returns (uint256) {
        return adapterIds.length;
    }
}
