import prisma from "../db/prisma";

export interface TradeBalance {
    loopi: number;
}

export async function executeTrade(
    guestIdA: number,
    guestIdB: number,
    offerA: TradeBalance,
    offerB: TradeBalance
): Promise<{ balanceA: TradeBalance; balanceB: TradeBalance }> {
    return prisma.$transaction(async (tx) => {
        // 1. Read both balances
        const accountA = await tx.account.findUnique({ where: { id: guestIdA } });
        const accountB = await tx.account.findUnique({ where: { id: guestIdB } });

        if (!accountA) throw new Error("Player A not found");
        if (!accountB) throw new Error("Player B not found");

        // 2. Validate sufficient funds (loopi maps to duckets column)
        if (accountA.duckets < offerA.loopi) throw new Error("Player A has insufficient Loopi");
        if (accountB.duckets < offerB.loopi) throw new Error("Player B has insufficient Loopi");

        // 3. Calculate new balances
        const newLoopiA = accountA.duckets - offerA.loopi + offerB.loopi;
        const newLoopiB = accountB.duckets - offerB.loopi + offerA.loopi;

        // 4. Update both accounts
        await tx.account.update({
            where: { id: guestIdA },
            data: { duckets: newLoopiA },
        });
        await tx.account.update({
            where: { id: guestIdB },
            data: { duckets: newLoopiB },
        });

        // 5. Log transactions
        const txRecords = [];

        if (offerA.loopi > 0) {
            txRecords.push(
                { guestId: guestIdA, currency: "loopi", amount: -offerA.loopi, reason: "trade_sent", balanceAfter: newLoopiA, sourceId: guestIdB },
                { guestId: guestIdB, currency: "loopi", amount: offerA.loopi, reason: "trade_received", balanceAfter: newLoopiB, sourceId: guestIdA },
            );
        }
        if (offerB.loopi > 0) {
            txRecords.push(
                { guestId: guestIdB, currency: "loopi", amount: -offerB.loopi, reason: "trade_sent", balanceAfter: newLoopiB, sourceId: guestIdA },
                { guestId: guestIdA, currency: "loopi", amount: offerB.loopi, reason: "trade_received", balanceAfter: newLoopiA, sourceId: guestIdB },
            );
        }

        if (txRecords.length > 0) {
            await tx.currencyTransaction.createMany({ data: txRecords });
        }

        return {
            balanceA: { loopi: newLoopiA },
            balanceB: { loopi: newLoopiB },
        };
    });
}
