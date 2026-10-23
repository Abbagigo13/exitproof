// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ReceiptNFT
/// @notice Open-mint ERC-721 receipt NFT. No imports, no assembly. Paris EVM safe.
contract ReceiptNFT {
    string public name = "ExitProof Receipt";
    string public symbol = "EPRX";

    struct TokenData {
        bytes32 receiptHash;
        string protocolRef;
        string riskLevel;
        uint256 riskScore;
        address minter;
    }

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event ReceiptNFTMinted(
        address indexed minter,
        uint256 indexed tokenId,
        bytes32 receiptHash,
        string protocolRef
    );

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => TokenData) private _tokenData;
    uint256 private _nextTokenId = 1;

    // ── ERC-721 core ──────────────────────────────────────────────────────────

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "nonexistent token");
        return owner;
    }

    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "not authorized"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner ||
            getApproved(tokenId) == msg.sender ||
            isApprovedForAll(owner, msg.sender),
            "not authorized"
        );
        require(from == owner, "wrong from");
        require(to != address(0), "zero address");
        _tokenApprovals[tokenId] = address(0);
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) public {
        transferFrom(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f || // ERC721Metadata
            interfaceId == 0x01ffc9a7;   // ERC165
    }

    // ── Mint ──────────────────────────────────────────────────────────────────

    function mint(
        bytes32 receiptHash,
        string calldata protocolRef,
        string calldata riskLevel,
        uint256 riskScore
    ) external {
        require(riskScore <= 100, "score out of range");
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = msg.sender;
        _balances[msg.sender]++;
        emit Transfer(address(0), msg.sender, tokenId);
        _tokenData[tokenId] = TokenData(receiptHash, protocolRef, riskLevel, riskScore, msg.sender);
        emit ReceiptNFTMinted(msg.sender, tokenId, receiptHash, protocolRef);
    }

    // ── tokenURI — pure Solidity base64, no assembly ──────────────────────────

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "nonexistent token");
        TokenData storage d = _tokenData[tokenId];

        string memory json = string(abi.encodePacked(
            '{"name":"ExitProof Receipt - ', d.protocolRef,
            '","description":"Risk receipt anchored on Arc Mainnet.",',
            '"attributes":[{"trait_type":"Risk Score","value":', _uint2str(d.riskScore),
            '},{"trait_type":"Risk Level","value":"', d.riskLevel,
            '"},{"trait_type":"Receipt Hash","value":"', _bytes32ToHex(d.receiptHash),
            '"},{"trait_type":"Protocol","value":"', d.protocolRef, '"}]}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(bytes(json))
        ));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _uint2str(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 temp = v;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buf = new bytes(digits);
        while (v != 0) {
            digits--;
            buf[digits] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
        return string(buf);
    }

    function _bytes32ToHex(bytes32 v) internal pure returns (string memory) {
        bytes memory s = new bytes(66);
        s[0] = "0"; s[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            uint8 b = uint8(v[i]);
            s[2 + i * 2]     = _hexNibble(b >> 4);
            s[3 + i * 2] = _hexNibble(b & 0x0f);
        }
        return string(s);
    }

    function _hexNibble(uint8 n) internal pure returns (bytes1) {
        return n < 10 ? bytes1(n + 48) : bytes1(n + 87);
    }

    bytes internal constant B64_TABLE =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory out = new bytes(encodedLen);

        uint256 i = 0;
        uint256 j = 0;
        while (i + 2 < len) {
            uint256 a = uint8(data[i]);
            uint256 b = uint8(data[i + 1]);
            uint256 c = uint8(data[i + 2]);
            out[j]     = B64_TABLE[(a >> 2) & 0x3F];
            out[j + 1] = B64_TABLE[((a & 0x03) << 4) | ((b >> 4) & 0x0F)];
            out[j + 2] = B64_TABLE[((b & 0x0F) << 2) | ((c >> 6) & 0x03)];
            out[j + 3] = B64_TABLE[c & 0x3F];
            i += 3;
            j += 4;
        }

        if (i + 1 == len) {
            uint256 a = uint8(data[i]);
            out[j]     = B64_TABLE[(a >> 2) & 0x3F];
            out[j + 1] = B64_TABLE[(a & 0x03) << 4];
            out[j + 2] = "=";
            out[j + 3] = "=";
        } else if (i + 2 == len) {
            uint256 a = uint8(data[i]);
            uint256 b = uint8(data[i + 1]);
            out[j]     = B64_TABLE[(a >> 2) & 0x3F];
            out[j + 1] = B64_TABLE[((a & 0x03) << 4) | ((b >> 4) & 0x0F)];
            out[j + 2] = B64_TABLE[(b & 0x0F) << 2];
            out[j + 3] = "=";
        }

        return string(out);
    }
}
