// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexusNFT
 * @dev ERC-721 NFT contract for NEXUS Marketplace on Polygon Amoy
 * 
 * Features:
 * - safeMint: Anyone can mint (for demo purposes)
 * - tokenURI: IPFS-based metadata
 * - Standard ERC-721 transfers
 * 
 * Deploy on Polygon Amoy Testnet:
 *   npx hardhat run scripts/deploy.ts --network amoy
 */
contract NexusNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("NEXUS NFT", "NXNFT") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT. Open to anyone for demo purposes.
     * In production, add access control or payment requirement.
     */
    function safeMint(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Returns the total number of tokens minted.
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
