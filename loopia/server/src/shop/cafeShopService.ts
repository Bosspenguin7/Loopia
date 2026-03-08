import prisma from "../db/prisma";
import { removeCurrency } from "../economy/economyService";

export async function getCafeItems() {
    return prisma.item.findMany({
        where: { category: "cafe_food", isActive: true },
        orderBy: { sortOrder: "asc" },
    });
}

export async function getCafeInventory(guestId: number) {
    return prisma.inventoryItem.findMany({
        where: {
            guestId,
            item: { category: "cafe_food" },
        },
        include: { item: true },
    });
}

export async function purchaseCafeItem(guestId: number, itemId: number) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive || item.category !== "cafe_food") {
        throw new Error("Item not found or not available");
    }
    if (item.priceLoopi <= 0) {
        throw new Error("Item has no Loopi price");
    }

    // Remove currency (throws if insufficient balance)
    const newBalance = await removeCurrency(guestId, "loopi", item.priceLoopi, "cafe_purchase");

    // Upsert inventory (increment quantity if already owned)
    await prisma.inventoryItem.upsert({
        where: { guestId_itemId: { guestId, itemId } },
        update: { quantity: { increment: 1 } },
        create: { guestId, itemId, quantity: 1 },
    });

    return {
        item: { id: item.id, name: item.name, iconEmoji: item.iconEmoji },
        newBalance,
    };
}

export async function consumeCafeItem(guestId: number, itemId: number) {
    const inv = await prisma.inventoryItem.findUnique({
        where: { guestId_itemId: { guestId, itemId } },
        include: { item: true },
    });

    if (!inv || inv.item.category !== "cafe_food") {
        throw new Error("Item not in inventory");
    }

    if (inv.quantity <= 1) {
        await prisma.inventoryItem.delete({
            where: { id: inv.id },
        });
        return { remaining: 0 };
    }

    await prisma.inventoryItem.update({
        where: { id: inv.id },
        data: { quantity: { decrement: 1 } },
    });

    return { remaining: inv.quantity - 1 };
}
