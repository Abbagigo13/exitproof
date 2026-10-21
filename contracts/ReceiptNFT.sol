// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title ReceiptNFT
/// @notice Open-mint ERC-721 where each token represents an ExitProof risk receipt.
contract ReceiptNFT is ERC721 {
    struct TokenData {
        bytes32 receiptHash;
        string protocolRef;
        string riskLevel;
        uint256 riskScore;
        address minter;
    }

    event ReceiptNFTMinted(
        address indexed minter,
        uint256 indexed tokenId,
        bytes32 receiptHash,
        string protocolRef
    );

    mapping(uint256 => TokenData) private _tokenData;
    uint256 private _nextTokenId;

    constructor() ERC721("ExitProof Receipt", "EPRX") {
        _nextTokenId = 1;
    }

    /// @notice Mints a receipt NFT for a risk receipt.
    /// @param receiptHash SHA-256 hash anchored in RiskReceiptRegistry.
    /// @param protocolRef Protocol name reference.
    /// @param riskLevel Human-readable risk level label.
    /// @param riskScore Composite risk score, expected in the 0-100 range.
    function mint(
        bytes32 receiptHash,
        string calldata protocolRef,
        string calldata riskLevel,
        uint256 riskScore
    ) external {
        require(riskScore <= 100, "ReceiptNFT: riskScore out of range");

        uint256 tokenId = _nextTokenId;
        _nextTokenId = tokenId + 1;

        _safeMint(msg.sender, tokenId);

        _tokenData[tokenId] = TokenData({
            receiptHash: receiptHash,
            protocolRef: protocolRef,
            riskLevel: riskLevel,
            riskScore: riskScore,
            minter: msg.sender
        });

        emit ReceiptNFTMinted(msg.sender, tokenId, receiptHash, protocolRef);
    }

    /// @notice Returns token metadata as a base64-encoded JSON data URI.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        TokenData storage data = _tokenData[tokenId];
        string memory receiptHashHex = _toHexString(data.receiptHash);

        string memory json = string(
            abi.encodePacked(
                '{"name":"ExitProof Receipt - ',
                data.protocolRef,
                '","description":"Risk receipt anchored on Arc Mainnet.","attributes":[{"trait_type":"Risk Score","value":',
                Strings.toString(data.riskScore),
                '},{"trait_type":"Risk Level","value":"',
                data.riskLevel,
                '"},{"trait_type":"Receipt Hash","value":"',
                receiptHashHex,
                '"},{"trait_type":"Protocol","value":"',
                data.protocolRef,
                '"}]}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _toHexString(bytes32 value) private pure returns (string memory) {
        bytes16 alphabet = 0x30313233343536373839616263646566;
        bytes memory str = new bytes(66);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 32; ++i) {
            uint8 b = uint8(value[i]);
            str[2 + (i * 2)] = bytes1(alphabet[b >> 4]);
            str[3 + (i * 2)] = bytes1(alphabet[b & 0x0f]);
        }

        return string(str);
    }
}
