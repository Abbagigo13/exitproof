// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title RiskReceiptRegistry
/// @notice Registry that allows anyone to anchor risk receipt hashes on-chain.
/// @dev Each receipt hash can only be anchored once.
contract RiskReceiptRegistry is Ownable, Pausable {
    /// @notice Stored data for an anchored risk receipt.
    /// @param anchorer Address that anchored the receipt hash.
    /// @param timestamp Block timestamp when the receipt was anchored.
    /// @param protocolRef Human-readable protocol reference.
    struct Receipt {
        address anchorer;
        uint256 timestamp;
        string protocolRef;
    }

    /// @notice Emitted when a receipt hash is successfully anchored.
    /// @param receiptHash Hash of the anchored receipt.
    /// @param anchorer Address that anchored the receipt.
    /// @param protocolRef Human-readable protocol reference.
    /// @param timestamp Block timestamp when the receipt was anchored.
    event ReceiptAnchored(
        bytes32 indexed receiptHash,
        address indexed anchorer,
        string protocolRef,
        uint256 timestamp
    );

    /// @notice Reverts when attempting to anchor a hash that is already anchored.
    /// @param receiptHash The receipt hash that is already anchored.
    error AlreadyAnchored(bytes32 receiptHash);

    /// @notice Mapping of receipt hash to anchored receipt data.
    mapping(bytes32 receiptHash => Receipt) private _receipts;

    /// @notice Initializes the registry with an initial owner.
    /// @param initialOwner Address that will own the contract.
    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Anchors a new risk receipt hash on-chain.
    /// @dev Reverts if the receipt hash has already been anchored.
    /// @param receiptHash Hash of the risk receipt to anchor.
    /// @param protocolRef Human-readable protocol reference.
    function anchorReceipt(bytes32 receiptHash, string calldata protocolRef) external whenNotPaused {
        if (_receipts[receiptHash].timestamp != 0) {
            revert AlreadyAnchored(receiptHash);
        }

        uint256 anchoredAt = block.timestamp;

        _receipts[receiptHash] = Receipt({
            anchorer: msg.sender,
            timestamp: anchoredAt,
            protocolRef: protocolRef
        });

        emit ReceiptAnchored(receiptHash, msg.sender, protocolRef, anchoredAt);
    }

    /// @notice Returns anchored receipt data for a given hash.
    /// @dev Returns zero values when the receipt has not been anchored.
    /// @param receiptHash Hash of the receipt to query.
    /// @return anchorer Address that anchored the receipt.
    /// @return timestamp Block timestamp when anchored.
    /// @return protocolRef Human-readable protocol reference.
    function getReceipt(bytes32 receiptHash)
        external
        view
        returns (address anchorer, uint256 timestamp, string memory protocolRef)
    {
        Receipt storage receipt = _receipts[receiptHash];
        return (receipt.anchorer, receipt.timestamp, receipt.protocolRef);
    }

    /// @notice Returns whether a receipt hash has been anchored.
    /// @param receiptHash Hash of the receipt to query.
    /// @return True if anchored, false otherwise.
    function isAnchored(bytes32 receiptHash) external view returns (bool) {
        return _receipts[receiptHash].timestamp != 0;
    }

    /// @notice Pauses anchoring of new receipts.
    /// @dev Callable only by the owner.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses anchoring of new receipts.
    /// @dev Callable only by the owner.
    function unpause() external onlyOwner {
        _unpause();
    }
}
