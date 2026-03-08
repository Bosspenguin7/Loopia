import prisma from "../db/prisma";
import { LEVELING } from "@shared/constants";
import { deliverToGuestId } from "../social/crossRoomMessenger";

export async function grantXp(
    guestId: number,
    amount: number,
    reason: string
): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    const result = await prisma.$transaction(async (tx) => {
        const account = await tx.account.findUnique({
            where: { id: guestId },
            select: { xp: true, level: true },
        });
        if (!account) throw new Error("Account not found");

        const oldLevel = account.level;
        const newXp = account.xp + amount;
        const newLevel = LEVELING.levelFromXp(newXp);

        await tx.account.update({
            where: { id: guestId },
            data: { xp: newXp, level: newLevel },
        });

        // Log XP as a currency transaction for audit trail
        await tx.currencyTransaction.create({
            data: {
                guestId,
                currency: "xp",
                amount,
                reason,
                balanceAfter: newXp,
            },
        });

        return { xp: newXp, level: newLevel, leveledUp: newLevel > oldLevel };
    });

    // Notify client of level update
    try {
        await deliverToGuestId(guestId, "levelUpdate", {
            xp: result.xp,
            level: result.level,
            leveledUp: result.leveledUp,
        });
    } catch {}

    return result;
}
