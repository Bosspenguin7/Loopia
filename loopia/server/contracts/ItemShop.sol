// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ItemShop is ReentrancyGuard {
    address public owner;
    uint256 public totalPurchases;

    struct PurchaseRecord {
        uint256 itemId;
        uint256 price;
        uint256 timestamp;
    }

    // On-chain purchase tracking
    mapping(address => PurchaseRecord[]) public purchases;

    event ItemPurchased(address indexed buyer, uint256 itemId, uint256 price, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    function purchaseItem(uint256 itemId) external payable nonReentrant {
        require(msg.value > 0, "Payment required");
        totalPurchases++;
        purchases[msg.sender].push(PurchaseRecord(itemId, msg.value, block.timestamp));
        emit ItemPurchased(msg.sender, itemId, msg.value, block.timestamp);
    }

    function getMyPurchases(address buyer) external view returns (PurchaseRecord[] memory) {
        return purchases[buyer];
    }

    function getPurchaseCount(address buyer) external view returns (uint256) {
        return purchases[buyer].length;
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}
