// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NexusEscrow
 * @dev Escrow contract for NEXUS Marketplace offers.
 * 
 * Flow:
 *   1. Buyer calls createOffer() with POL payment → funds locked in contract
 *   2. Seller calls acceptOffer() → funds released to seller
 *   3. Buyer calls cancelOffer() → funds refunded to buyer
 *   4. Seller calls rejectOffer() → funds refunded to buyer
 */
contract NexusEscrow is ReentrancyGuard {
    enum OfferStatus { Active, Accepted, Cancelled, Rejected }

    struct Offer {
        address buyer;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        OfferStatus status;
        uint256 createdAt;
    }

    uint256 private _nextOfferId;
    mapping(uint256 => Offer) private _offers;

    // Track active offers per NFT to prevent duplicates from same buyer
    mapping(bytes32 => bool) private _activeOfferKeys;

    event OfferCreated(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 amount
    );

    event OfferAccepted(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event OfferCancelled(uint256 indexed offerId, address indexed buyer, uint256 amount);
    event OfferRejected(uint256 indexed offerId, address indexed seller, uint256 amount);

    /**
     * @dev Create a new offer by depositing POL into escrow.
     * @param nftContract The ERC-721 contract address
     * @param tokenId The token ID being offered on
     * @param seller The NFT owner's address
     */
    function createOffer(
        address nftContract,
        uint256 tokenId,
        address seller
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Must send POL with offer");
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Cannot offer on your own NFT");

        // Prevent duplicate active offers from same buyer on same NFT
        bytes32 offerKey = keccak256(abi.encodePacked(msg.sender, nftContract, tokenId));
        require(!_activeOfferKeys[offerKey], "Active offer already exists");

        uint256 offerId = _nextOfferId++;
        _offers[offerId] = Offer({
            buyer: msg.sender,
            seller: seller,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: msg.value,
            status: OfferStatus.Active,
            createdAt: block.timestamp
        });

        _activeOfferKeys[offerKey] = true;

        emit OfferCreated(offerId, msg.sender, seller, nftContract, tokenId, msg.value);

        return offerId;
    }

    /**
     * @dev Seller accepts the offer → POL released to seller.
     * NFT transfer is handled separately by the frontend.
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = _offers[offerId];
        require(offer.status == OfferStatus.Active, "Offer not active");
        require(msg.sender == offer.seller, "Only seller can accept");

        offer.status = OfferStatus.Accepted;

        // Clear active offer key
        bytes32 offerKey = keccak256(abi.encodePacked(offer.buyer, offer.nftContract, offer.tokenId));
        _activeOfferKeys[offerKey] = false;

        // Transfer POL to seller
        (bool success, ) = payable(offer.seller).call{value: offer.amount}("");
        require(success, "Payment transfer failed");

        emit OfferAccepted(offerId, offer.buyer, offer.seller, offer.amount);
    }

    /**
     * @dev Buyer cancels their offer → POL refunded to buyer.
     */
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = _offers[offerId];
        require(offer.status == OfferStatus.Active, "Offer not active");
        require(msg.sender == offer.buyer, "Only buyer can cancel");

        offer.status = OfferStatus.Cancelled;

        bytes32 offerKey = keccak256(abi.encodePacked(offer.buyer, offer.nftContract, offer.tokenId));
        _activeOfferKeys[offerKey] = false;

        // Refund buyer
        (bool success, ) = payable(offer.buyer).call{value: offer.amount}("");
        require(success, "Refund failed");

        emit OfferCancelled(offerId, offer.buyer, offer.amount);
    }

    /**
     * @dev Seller rejects the offer → POL refunded to buyer.
     */
    function rejectOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = _offers[offerId];
        require(offer.status == OfferStatus.Active, "Offer not active");
        require(msg.sender == offer.seller, "Only seller can reject");

        offer.status = OfferStatus.Rejected;

        bytes32 offerKey = keccak256(abi.encodePacked(offer.buyer, offer.nftContract, offer.tokenId));
        _activeOfferKeys[offerKey] = false;

        // Refund buyer
        (bool success, ) = payable(offer.buyer).call{value: offer.amount}("");
        require(success, "Refund failed");

        emit OfferRejected(offerId, offer.seller, offer.amount);
    }

    // ─── View Functions ─────────────────────────────────────

    function getOffer(uint256 offerId) external view returns (
        address buyer,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        OfferStatus status,
        uint256 createdAt
    ) {
        Offer memory o = _offers[offerId];
        return (o.buyer, o.seller, o.nftContract, o.tokenId, o.amount, o.status, o.createdAt);
    }

    function totalOffers() external view returns (uint256) {
        return _nextOfferId;
    }
}
