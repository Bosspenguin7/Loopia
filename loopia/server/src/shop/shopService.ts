import { ethers } from "ethers";
import prisma from "../db/prisma";
import { decryptPrivateKey } from "../wallet/walletService";

// Minimal ABI for ItemShop contract
const ITEM_SHOP_ABI = [
    "function purchaseItem(uint256 itemId) external payable",
    "function getMyPurchases(address buyer) external view returns (tuple(uint256 itemId, uint256 price, uint256 timestamp)[])",
    "function getPurchaseCount(address buyer) external view returns (uint256)",
    "function totalPurchases() external view returns (uint256)",
];

function getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.AVAX_RPC_URL;
    if (!rpcUrl) throw new Error("AVAX_RPC_URL is not set");
    return new ethers.JsonRpcProvider(rpcUrl);
}

function getContractAddress(): string {
    const addr = process.env.SHOP_CONTRACT_ADDRESS;
    if (!addr) throw new Error("SHOP_CONTRACT_ADDRESS is not set in .env");
    return addr;
}

export async function getShopItems() {
    return prisma.item.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function getInventory(guestId: number) {
    return prisma.inventoryItem.findMany({
        where: { guestId },
        include: { item: true },
    });
}

export async function purchaseItemWithAvax(guestId: number, itemId: number) {
    // 1. Get item from DB
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive) {
        throw new Error("Item not found or not available");
    }

    // 2. Get user's wallet
    const account = await prisma.account.findUnique({
        where: { id: guestId },
        select: { walletAddress: true, encryptedKey: true },
    });

    if (!account?.walletAddress || !account?.encryptedKey) {
        throw new Error("No wallet found. Create a wallet first.");
    }

    // 3. Check if already owned
    const existing = await prisma.inventoryItem.findUnique({
        where: { guestId_itemId: { guestId, itemId } },
    });
    if (existing) {
        throw new Error("You already own this item");
    }

    // 4. Decrypt private key and create signer
    const privateKey = decryptPrivateKey(account.encryptedKey);
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);

    // 5. Check balance
    const balance = await provider.getBalance(account.walletAddress);
    const priceWei = ethers.parseEther(item.priceAvax);
    if (balance < priceWei) {
        throw new Error(`Insufficient AVAX balance. Need ${item.priceAvax} AVAX`);
    }

    // 6. Send transaction to smart contract
    const contractAddress = getContractAddress();
    const contract = new ethers.Contract(contractAddress, ITEM_SHOP_ABI, wallet);

    const tx = await contract.purchaseItem(itemId, { value: priceWei });
    const receipt = await tx.wait();
    const txHash = receipt.hash;

    // 7. Save to DB (purchase record + inventory)
    await prisma.$transaction([
        prisma.purchase.create({
            data: {
                guestId,
                itemId,
                priceAvax: item.priceAvax,
                txHash,
                contractAddr: contractAddress,
            },
        }),
        prisma.inventoryItem.create({
            data: {
                guestId,
                itemId,
                quantity: 1,
            },
        }),
    ]);

    console.log(`[Shop] Purchase: guest=${guestId} item=${item.name} tx=${txHash}`);

    return {
        txHash,
        snowtraceUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
        item: { id: item.id, name: item.name, iconEmoji: item.iconEmoji },
    };
}
