import prisma from "../db/prisma";
import { addCurrency } from "../economy/economyService";
import { grantXp } from "../leveling/levelingService";
import { QUEST } from "@shared/constants";

// ─── Helpers ───

function startOfDayUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isConsecutiveDay(lastDate: Date | null): boolean {
    if (!lastDate) return false;
    const today = startOfDayUTC();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const lastDay = new Date(Date.UTC(
        lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()
    ));
    return lastDay.getTime() === yesterday.getTime();
}

// ─── Public API ───

export async function getActiveQuestsForScene(sceneKey: string) {
    return prisma.quest.findMany({
        where: { sceneKey, isActive: true },
    });
}

export async function getQuestProgress(guestId: number, questId: number) {
    const todayStart = startOfDayUTC();

    const [completedToday, streak, pendingSubmission, fishRecord] = await Promise.all([
        prisma.questCompletion.findFirst({
            where: { guestId, questId, completedAt: { gte: todayStart } },
        }),
        prisma.questStreak.findUnique({
            where: { guestId_questId: { guestId, questId } },
        }),
        prisma.questSubmission.findFirst({
            where: { guestId, questId, status: "pending" },
            orderBy: { submittedAt: "desc" },
        }),
        prisma.fishInventory.findUnique({
            where: { guestId_fishType: { guestId, fishType: "salmon" } },
        }),
    ]);

    return {
        completedToday: !!completedToday,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        badgeEarned: streak?.badgeEarned ?? false,
        hasPendingSubmission: !!pendingSubmission,
        fishCount: fishRecord?.quantity ?? 0,
    };
}

export async function hasCompletedToday(guestId: number, questId: number): Promise<boolean> {
    const todayStart = startOfDayUTC();
    const completion = await prisma.questCompletion.findFirst({
        where: { guestId, questId, completedAt: { gte: todayStart } },
    });
    return !!completion;
}

export async function submitQuestLink(guestId: number, questId: number, linkUrl: string) {
    // Validate quest exists and is link_submission type
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.questType !== "link_submission") {
        throw new Error("Invalid quest");
    }

    // Check daily completion
    if (await hasCompletedToday(guestId, questId)) {
        throw new Error("Quest already completed today");
    }

    // Check for existing pending submission
    const existing = await prisma.questSubmission.findFirst({
        where: { guestId, questId, status: "pending" },
    });
    if (existing) {
        throw new Error("You already have a pending submission for this quest");
    }

    // Validate link
    if (!linkUrl || linkUrl.length > QUEST.MAX_LINK_LENGTH) {
        throw new Error("Invalid link URL");
    }

    return prisma.questSubmission.create({
        data: { guestId, questId, linkUrl },
    });
}

export async function getFishInventory(guestId: number) {
    return prisma.fishInventory.findMany({
        where: { guestId, quantity: { gt: 0 } },
    });
}

export async function catchFish(guestId: number) {
    return prisma.fishInventory.upsert({
        where: { guestId_fishType: { guestId, fishType: "salmon" } },
        update: { quantity: { increment: 1 } },
        create: { guestId, fishType: "salmon", quantity: 1 },
    });
}

export async function completeFishingQuest(guestId: number, questId: number) {
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest || quest.questType !== "fishing_minigame") {
        throw new Error("Invalid quest");
    }

    if (await hasCompletedToday(guestId, questId)) {
        throw new Error("Quest already completed today");
    }

    // Check fish inventory
    const fish = await prisma.fishInventory.findUnique({
        where: { guestId_fishType: { guestId, fishType: "salmon" } },
    });
    if (!fish || fish.quantity < 1) {
        throw new Error("You need at least 1 salmon to complete this quest");
    }

    // Deduct fish
    await prisma.fishInventory.update({
        where: { guestId_fishType: { guestId, fishType: "salmon" } },
        data: { quantity: { decrement: 1 } },
    });

    return completeQuest(guestId, questId);
}

export async function completeQuest(guestId: number, questId: number) {
    const quest = await prisma.quest.findUnique({ where: { id: questId } });
    if (!quest) throw new Error("Quest not found");

    // Record completion
    await prisma.questCompletion.create({
        data: { guestId, questId },
    });

    // Update streak
    const streak = await prisma.questStreak.upsert({
        where: { guestId_questId: { guestId, questId } },
        create: {
            guestId,
            questId,
            currentStreak: 1,
            longestStreak: 1,
            lastCompletedAt: new Date(),
        },
        update: {},
    });

    // Calculate new streak
    const consecutive = isConsecutiveDay(streak.lastCompletedAt);
    const newCurrent = consecutive ? streak.currentStreak + 1 : 1;
    const newLongest = Math.max(streak.longestStreak, newCurrent);
    const earnBadge = !streak.badgeEarned && newCurrent >= QUEST.GROTTO_STREAK_FOR_BADGE;

    await prisma.questStreak.update({
        where: { guestId_questId: { guestId, questId } },
        data: {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastCompletedAt: new Date(),
            ...(earnBadge ? { badgeEarned: true, badgeEarnedAt: new Date() } : {}),
        },
    });

    // Grant rewards
    if (quest.loopiReward > 0) {
        await addCurrency(guestId, "loopi", quest.loopiReward, `quest_${quest.questKey}`);
    }
    let levelResult;
    if (quest.xpReward > 0) {
        levelResult = await grantXp(guestId, quest.xpReward, `quest_${quest.questKey}`);
    }

    return {
        loopiReward: quest.loopiReward,
        xpReward: quest.xpReward,
        newStreak: newCurrent,
        badgeEarned: earnBadge,
        levelResult,
    };
}

export async function getAllQuestsWithProgress(guestId: number) {
    const quests = await prisma.quest.findMany({
        where: { isActive: true },
    });

    const results = await Promise.all(
        quests.map(async (quest) => {
            const progress = await getQuestProgress(guestId, quest.id);
            return { ...quest, progress };
        })
    );

    return results;
}

export async function approveSubmission(submissionId: number, reviewedBy: string, notes?: string) {
    const submission = await prisma.questSubmission.findUnique({
        where: { id: submissionId },
    });
    if (!submission) throw new Error("Submission not found");
    if (submission.status !== "pending") throw new Error("Submission already reviewed");

    await prisma.questSubmission.update({
        where: { id: submissionId },
        data: {
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy,
            reviewNotes: notes || null,
        },
    });

    return completeQuest(submission.guestId, submission.questId);
}

export async function rejectSubmission(submissionId: number, reviewedBy: string, notes?: string) {
    const submission = await prisma.questSubmission.findUnique({
        where: { id: submissionId },
    });
    if (!submission) throw new Error("Submission not found");
    if (submission.status !== "pending") throw new Error("Submission already reviewed");

    return prisma.questSubmission.update({
        where: { id: submissionId },
        data: {
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy,
            reviewNotes: notes || null,
        },
    });
}
