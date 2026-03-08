import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma before importing the service
vi.mock('../loopia/server/src/db/prisma', () => {
    const mockTx = {
        account: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
        currencyTransaction: {
            create: vi.fn(),
        },
    };

    return {
        default: {
            $transaction: vi.fn((fn: (tx: typeof mockTx) => Promise<any>) => fn(mockTx)),
            account: {
                findUnique: vi.fn(),
            },
            // expose mockTx for test assertions
            _mockTx: mockTx,
        },
    };
});

import prisma from '../server/src/db/prisma';
import { addCurrency, removeCurrency, getBalance } from '../server/src/economy/economyService';

const mockTx = (prisma as any)._mockTx;

describe('economyService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── addCurrency ───

    describe('addCurrency', () => {
        it('should increment balance and log transaction', async () => {
            mockTx.account.update.mockResolvedValue({ duckets: 150 });
            mockTx.currencyTransaction.create.mockResolvedValue({});

            const result = await addCurrency(1, 'loopi', 50, 'test_reward');

            expect(result).toBe(150);
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { duckets: { increment: 50 } },
            });
            expect(mockTx.currencyTransaction.create).toHaveBeenCalledWith({
                data: {
                    guestId: 1,
                    currency: 'loopi',
                    amount: 50,
                    reason: 'test_reward',
                    balanceAfter: 150,
                    sourceId: null,
                },
            });
        });

        it('should pass sourceId when provided', async () => {
            mockTx.account.update.mockResolvedValue({ duckets: 200 });
            mockTx.currencyTransaction.create.mockResolvedValue({});

            await addCurrency(1, 'loopi', 100, 'trade', 42);

            expect(mockTx.currencyTransaction.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ sourceId: 42 }),
            });
        });

        it('should handle zero amount', async () => {
            mockTx.account.update.mockResolvedValue({ duckets: 100 });
            mockTx.currencyTransaction.create.mockResolvedValue({});

            const result = await addCurrency(1, 'loopi', 0, 'zero_add');

            expect(result).toBe(100);
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { duckets: { increment: 0 } },
            });
        });
    });

    // ─── removeCurrency ───

    describe('removeCurrency', () => {
        it('should decrement balance and log negative transaction', async () => {
            mockTx.account.findUnique.mockResolvedValue({ id: 1, duckets: 100 });
            mockTx.account.update.mockResolvedValue({ duckets: 70 });
            mockTx.currencyTransaction.create.mockResolvedValue({});

            const result = await removeCurrency(1, 'loopi', 30, 'purchase');

            expect(result).toBe(70);
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { duckets: { decrement: 30 } },
            });
            expect(mockTx.currencyTransaction.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ amount: -30 }),
            });
        });

        it('should throw on insufficient balance', async () => {
            mockTx.account.findUnique.mockResolvedValue({ id: 1, duckets: 10 });

            await expect(removeCurrency(1, 'loopi', 50, 'purchase')).rejects.toThrow('Insufficient balance');
        });

        it('should throw on guest not found', async () => {
            mockTx.account.findUnique.mockResolvedValue(null);

            await expect(removeCurrency(1, 'loopi', 10, 'purchase')).rejects.toThrow('Guest not found');
        });

        it('should pass sourceId when provided', async () => {
            mockTx.account.findUnique.mockResolvedValue({ id: 1, duckets: 500 });
            mockTx.account.update.mockResolvedValue({ duckets: 400 });
            mockTx.currencyTransaction.create.mockResolvedValue({});

            await removeCurrency(1, 'loopi', 100, 'trade', 99);

            expect(mockTx.currencyTransaction.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ sourceId: 99 }),
            });
        });

        it('should allow removing exact balance', async () => {
            mockTx.account.findUnique.mockResolvedValue({ id: 1, duckets: 50 });
            mockTx.account.update.mockResolvedValue({ duckets: 0 });
            mockTx.currencyTransaction.create.mockResolvedValue({});

            const result = await removeCurrency(1, 'loopi', 50, 'spend_all');

            expect(result).toBe(0);
        });
    });

    // ─── getBalance ───

    describe('getBalance', () => {
        it('should return loopi balance', async () => {
            (prisma.account.findUnique as any).mockResolvedValue({ duckets: 250 });

            const result = await getBalance(1);

            expect(result).toEqual({ loopi: 250 });
            expect(prisma.account.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: { duckets: true },
            });
        });

        it('should throw on guest not found', async () => {
            (prisma.account.findUnique as any).mockResolvedValue(null);

            await expect(getBalance(999)).rejects.toThrow('Guest not found');
        });

        it('should return zero balance', async () => {
            (prisma.account.findUnique as any).mockResolvedValue({ duckets: 0 });

            const result = await getBalance(1);

            expect(result).toEqual({ loopi: 0 });
        });
    });
});
