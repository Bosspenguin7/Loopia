import prisma from "../db/prisma";

export async function addCurrency(
    guestId: number,
    currency: "loopi",
    amount: number,
    reason: string,
    sourceId?: number
): Promise<number> {
    // "loopi" maps to the `duckets` column in DB
    const dbField = "duckets" as const;

    const result = await prisma.$transaction(async (tx) => {
        const guest = await tx.account.update({
            where: { id: guestId },
            data: { [dbField]: { increment: amount } },
        });

        const balanceAfter = guest[dbField];

        await tx.currencyTransaction.create({
            data: {
                guestId,
                currency: "loopi",
                amount,
                reason,
                balanceAfter,
                sourceId: sourceId ?? null,
            },
        });

        return balanceAfter;
    });

    return result;
}

export async function removeCurrency(
    guestId: number,
    currency: "loopi",
    amount: number,
    reason: string,
    sourceId?: number
): Promise<number> {
    const dbField = "duckets" as const;

    const result = await prisma.$transaction(async (tx) => {
        const guest = await tx.account.findUnique({
            where: { id: guestId },
        });

        if (!guest) throw new Error("Guest not found");
        if (guest[dbField] < amount) throw new Error("Insufficient balance");

        const updated = await tx.account.update({
            where: { id: guestId },
            data: { [dbField]: { decrement: amount } },
        });

        const balanceAfter = updated[dbField];

        await tx.currencyTransaction.create({
            data: {
                guestId,
                currency: "loopi",
                amount: -amount,
                reason,
                balanceAfter,
                sourceId: sourceId ?? null,
            },
        });

        return balanceAfter;
    });

    return result;
}

export async function getBalance(guestId: number): Promise<{ loopi: number }> {
    const guest = await prisma.account.findUnique({
        where: { id: guestId },
        select: { duckets: true },
    });

    if (!guest) throw new Error("Guest not found");
    return { loopi: guest.duckets };
}
