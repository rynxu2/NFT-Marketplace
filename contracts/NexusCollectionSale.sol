// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NexusCollectionSale is ReentrancyGuard {
    event CollectionPurchased(
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256[] tokenIds,
        uint256 totalPrice
    );

    function buyCollectionBatch(
        address nftContract,
        address seller,
        uint256[] calldata tokenIds
    ) external payable nonReentrant {
        require(msg.value > 0, "No payment sent");
        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot buy own collection");
        require(tokenIds.length > 0, "No tokens specified");
        require(tokenIds.length <= 100, "Too many tokens");

        IERC721 nft = IERC721(nftContract);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(nft.ownerOf(tokenIds[i]) == seller, "Seller does not own token");
        }

        (bool sent, ) = payable(seller).call{value: msg.value}("");
        require(sent, "Payment failed");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            nft.transferFrom(seller, msg.sender, tokenIds[i]);
        }

        emit CollectionPurchased(msg.sender, seller, nftContract, tokenIds, msg.value);
    }
}
