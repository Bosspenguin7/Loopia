import prisma from "../db/prisma";
import { ECONOMY } from "@shared/constants";
import { addCurrency } from "./economyService";

function getUTCDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export interface DailyLoginResult {
    rewarded: boolean;
    streakDay: number;
    loopiEarned: number;
    totalLoopi: number;
    streakReset: boolean;
}

export async function processDailyLogin(guestId: number): Promise<DailyLoginResult> {
    const guest = await prisma.account.findUnique({
        where: { id: guestId },
        select: { loginStreak: true, lastLoginRewardAt: true, duckets: true },
    });

    if (!guest) throw new Error("Guest not found");

    const today = getUTCDateString(new Date());

    // Already claimed today?
    if (guest.lastLoginRewardAt && getUTCDateString(guest.lastLoginRewardAt) === today) {
        return {
            rewarded: false,
            streakDay: guest.loginStreak,
            loopiEarned: 0,
            totalLoopi: guest.duckets,
            streakReset: false,
        };
    }

    // Calculate streak
    let newStreak: number;
    let streakReset = false;

    if (guest.lastLoginRewardAt) {
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = getUTCDateString(yesterday);

        if (getUTCDateString(guest.lastLoginRewardAt) === yesterdayStr) {
            // Consecutive day — continue streak
            newStreak = guest.loginStreak + 1;
            if (newStreak > ECONOMY.DAILY_LOGIN_STREAK_MAX) {
                newStreak = 1;
                streakReset = true;
            }
        } else {
            // Missed a day — reset
            newStreak = 1;
            streakReset = guest.loginStreak > 1;
        }
    } else {
        // First login ever
        newStreak = 1;
    }

    const rewardIndex = newStreak - 1;
    const loopiEarned = ECONOMY.DAILY_LOGIN_REWARDS[rewardIndex] ?? 5;

    // Give reward
    const totalLoopi = await addCurrency(guestId, "loopi", loopiEarned, "daily_login");

    // Update streak
    await prisma.account.update({
        where: { id: guestId },
        data: {
            loginStreak: newStreak,
            lastLoginRewardAt: new Date(),
        },
    });

    return {
        rewarded: true,
        streakDay: newStreak,
        loopiEarned,
        totalLoopi,
        streakReset,
    };
}

export async function getDailyLoginInfo(guestId: number): Promise<{
    streakDay: number;
    claimedToday: boolean;
    nextReward: number;
}> {
    const guest = await prisma.account.findUnique({
        where: { id: guestId },
        select: { loginStreak: true, lastLoginRewardAt: true },
    });

    if (!guest) throw new Error("Guest not found");

    const today = getUTCDateString(new Date());
    const claimedToday = !!guest.lastLoginRewardAt && getUTCDateString(guest.lastLoginRewardAt) === today;

    let nextStreak = guest.loginStreak;
    if (!claimedToday) {
        // If claimed yesterday, streak continues; otherwise resets
        if (guest.lastLoginRewardAt) {
            const yesterday = new Date();
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            if (getUTCDateString(guest.lastLoginRewardAt) === getUTCDateString(yesterday)) {
                nextStreak = guest.loginStreak + 1;
                if (nextStreak > ECONOMY.DAILY_LOGIN_STREAK_MAX) nextStreak = 1;
            } else {
                nextStreak = 1;
            }
        } else {
            nextStreak = 1;
        }
    }

    const nextRewardIndex = claimedToday ? nextStreak : nextStreak - 1;
    const nextReward = ECONOMY.DAILY_LOGIN_REWARDS[Math.min(nextRewardIndex, ECONOMY.DAILY_LOGIN_STREAK_MAX - 1)] ?? 5;

    return {
        streakDay: guest.loginStreak,
        claimedToday,
        nextReward,
    };
}
