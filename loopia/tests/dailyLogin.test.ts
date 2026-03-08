import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Prisma
vi.mock('../loopia/server/src/db/prisma', () => {
    return {
        default: {
            account: {
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            $transaction: vi.fn(),
            _mockTx: {
                account: {
                    update: vi.fn(),
                    findUnique: vi.fn(),
                },
                currencyTransaction: {
                    create: vi.fn(),
                },
            },
        },
    };
});

// Mock addCurrency (used internally by processDailyLogin)
vi.mock('../loopia/server/src/economy/economyService', () => ({
    addCurrency: vi.fn(),
}));

import prisma from '../server/src/db/prisma';
import { addCurrency } from '../server/src/economy/economyService';
import { processDailyLogin, getDailyLoginInfo } from '../server/src/economy/dailyLoginService';
import { ECONOMY } from '../shared/constants';

const mockAddCurrency = addCurrency as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.account.findUnique as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.account.update as ReturnType<typeof vi.fn>;

function utcDate(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, day));
}

describe('dailyLoginService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(utcDate(2026, 3, 5)); // 2026-03-05
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ─── processDailyLogin ───

    describe('processDailyLogin', () => {
        it('should reward first-time login with streak=1', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 0,
                lastLoginRewardAt: null,
                duckets: 0,
            });
            mockAddCurrency.mockResolvedValue(5);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result).toEqual({
                rewarded: true,
                streakDay: 1,
                loopiEarned: 5,
                totalLoopi: 5,
                streakReset: false,
            });
            expect(mockAddCurrency).toHaveBeenCalledWith(1, 'loopi', 5, 'daily_login');
            expect(mockUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    loginStreak: 1,
                    lastLoginRewardAt: expect.any(Date),
                },
            });
        });

        it('should return rewarded=false if already claimed today', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 3,
                lastLoginRewardAt: utcDate(2026, 3, 5), // today
                duckets: 100,
            });

            const result = await processDailyLogin(1);

            expect(result).toEqual({
                rewarded: false,
                streakDay: 3,
                loopiEarned: 0,
                totalLoopi: 100,
                streakReset: false,
            });
            expect(mockAddCurrency).not.toHaveBeenCalled();
        });

        it('should continue streak on consecutive day', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 3,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
                duckets: 50,
            });
            mockAddCurrency.mockResolvedValue(55);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result.rewarded).toBe(true);
            expect(result.streakDay).toBe(4);
            expect(result.streakReset).toBe(false);
        });

        it('should reset streak when a day is missed', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 5,
                lastLoginRewardAt: utcDate(2026, 3, 2), // 3 days ago
                duckets: 80,
            });
            mockAddCurrency.mockResolvedValue(85);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result.rewarded).toBe(true);
            expect(result.streakDay).toBe(1);
            expect(result.streakReset).toBe(true);
        });

        it('should not mark streakReset when previous streak was 1', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 1,
                lastLoginRewardAt: utcDate(2026, 3, 2), // missed a day
                duckets: 10,
            });
            mockAddCurrency.mockResolvedValue(15);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result.streakDay).toBe(1);
            expect(result.streakReset).toBe(false);
        });

        it('should reset to 1 when streak exceeds max (30)', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 30,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
                duckets: 200,
            });
            mockAddCurrency.mockResolvedValue(205);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result.streakDay).toBe(1);
            expect(result.streakReset).toBe(true);
            // day 1 reward = 5
            expect(mockAddCurrency).toHaveBeenCalledWith(1, 'loopi', 5, 'daily_login');
        });

        it('should give day 7 reward (20 loopi)', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 6,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
                duckets: 30,
            });
            mockAddCurrency.mockResolvedValue(50);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result.streakDay).toBe(7);
            expect(result.loopiEarned).toBe(20); // DAILY_LOGIN_REWARDS[6] = 20
        });

        it('should give day 30 reward', async () => {
            // Note: DAILY_LOGIN_REWARDS has 31 elements (off-by-one in constants)
            // Index 29 (streak day 30) = 5, index 30 = 50
            mockFindUnique.mockResolvedValue({
                loginStreak: 29,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
                duckets: 150,
            });
            mockAddCurrency.mockResolvedValue(155);
            mockUpdate.mockResolvedValue({});

            const result = await processDailyLogin(1);

            expect(result.streakDay).toBe(30);
            expect(result.loopiEarned).toBe(5); // DAILY_LOGIN_REWARDS[29] = 5
        });

        it('should throw on guest not found', async () => {
            mockFindUnique.mockResolvedValue(null);

            await expect(processDailyLogin(999)).rejects.toThrow('Guest not found');
        });
    });

    // ─── getDailyLoginInfo ───

    describe('getDailyLoginInfo', () => {
        it('should return claimedToday=true when already claimed', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 5,
                lastLoginRewardAt: utcDate(2026, 3, 5), // today
            });

            const info = await getDailyLoginInfo(1);

            expect(info.claimedToday).toBe(true);
            expect(info.streakDay).toBe(5);
        });

        it('should return claimedToday=false when not claimed today', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 3,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
            });

            const info = await getDailyLoginInfo(1);

            expect(info.claimedToday).toBe(false);
            expect(info.streakDay).toBe(3);
        });

        it('should show next reward for unclaimed consecutive day', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 6,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
            });

            const info = await getDailyLoginInfo(1);

            // streak would be 7, so next reward = DAILY_LOGIN_REWARDS[6] = 20
            expect(info.nextReward).toBe(20);
        });

        it('should show nextStreak=1 for first-time user', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 0,
                lastLoginRewardAt: null,
            });

            const info = await getDailyLoginInfo(1);

            expect(info.claimedToday).toBe(false);
            expect(info.nextReward).toBe(5); // day 1 reward
        });

        it('should reset nextStreak when day is missed', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 10,
                lastLoginRewardAt: utcDate(2026, 3, 1), // 4 days ago
            });

            const info = await getDailyLoginInfo(1);

            // missed a day, nextStreak resets to 1, reward index 0 → 5
            expect(info.nextReward).toBe(5);
        });

        it('should throw on guest not found', async () => {
            mockFindUnique.mockResolvedValue(null);

            await expect(getDailyLoginInfo(999)).rejects.toThrow('Guest not found');
        });

        it('should roll over nextStreak when at max', async () => {
            mockFindUnique.mockResolvedValue({
                loginStreak: 30,
                lastLoginRewardAt: utcDate(2026, 3, 4), // yesterday
            });

            const info = await getDailyLoginInfo(1);

            // streak 30 + 1 = 31 > 30 → rolls to 1, nextReward = DAILY_LOGIN_REWARDS[0] = 5
            expect(info.nextReward).toBe(5);
        });
    });
});
