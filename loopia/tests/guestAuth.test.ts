import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../loopia/server/src/db/prisma', () => ({
    default: {
        account: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Mock crypto.randomUUID
vi.mock('crypto', async (importOriginal) => {
    const actual = await importOriginal<typeof import('crypto')>();
    return {
        ...actual,
        default: {
            ...actual,
            randomUUID: vi.fn(() => 'mock-uuid-1234'),
        },
        randomUUID: vi.fn(() => 'mock-uuid-1234'),
    };
});

import prisma from '../server/src/db/prisma';

const mockFindUnique = prisma.account.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.account.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.account.update as ReturnType<typeof vi.fn>;

// We test the route handlers by importing the router and extracting the registered handlers
// However, it's cleaner to replicate Express req/res mocks and invoke the route handler logic.

// Since guestAuth exports a Router with .post('/guest') and .put('/guest/name'),
// we'll import it and use supertest-like approach by extracting handler via router stack.
import { guestRouter } from '../server/src/auth/guestAuth';

type HandlerFn = (req: any, res: any) => Promise<any>;

function getHandler(method: string, path: string): HandlerFn {
    const layer = (guestRouter as any).stack.find(
        (l: any) => l.route?.path === path && l.route?.methods[method]
    );
    if (!layer) throw new Error(`No route found: ${method} ${path}`);
    return layer.route.stack[0].handle;
}

function createMockRes() {
    const res: any = {
        json: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
    };
    return res;
}

describe('guestAuth routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── POST /guest ───

    describe('POST /guest', () => {
        const handler = getHandler('post', '/guest');

        it('should create new guest when no token provided', async () => {
            mockCreate.mockResolvedValue({
                guestToken: 'mock-uuid-1234',
                displayName: null,
                id: 1,
            });
            const res = createMockRes();

            await handler({ body: {} }, res);

            expect(mockCreate).toHaveBeenCalledWith({
                data: { guestToken: 'mock-uuid-1234' },
            });
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-uuid-1234',
                displayName: null,
                guestId: 1,
            });
        });

        it('should return existing guest when valid token provided', async () => {
            mockFindUnique.mockResolvedValue({
                id: 5,
                guestToken: 'existing-token',
                displayName: 'OldUser',
            });
            mockUpdate.mockResolvedValue({});
            const res = createMockRes();

            await handler({ body: { token: 'existing-token' } }, res);

            expect(mockFindUnique).toHaveBeenCalledWith({
                where: { guestToken: 'existing-token' },
            });
            expect(mockUpdate).toHaveBeenCalledWith({
                where: { id: 5 },
                data: { lastSeenAt: expect.any(Date) },
            });
            expect(res.json).toHaveBeenCalledWith({
                token: 'existing-token',
                displayName: 'OldUser',
                guestId: 5,
            });
        });

        it('should create new guest when token is invalid (not found in DB)', async () => {
            mockFindUnique.mockResolvedValue(null);
            mockCreate.mockResolvedValue({
                guestToken: 'mock-uuid-1234',
                displayName: null,
                id: 10,
            });
            const res = createMockRes();

            await handler({ body: { token: 'bad-token' } }, res);

            expect(mockFindUnique).toHaveBeenCalledWith({
                where: { guestToken: 'bad-token' },
            });
            expect(mockCreate).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-uuid-1234',
                displayName: null,
                guestId: 10,
            });
        });

        it('should create new guest when token is not a string', async () => {
            mockCreate.mockResolvedValue({
                guestToken: 'mock-uuid-1234',
                displayName: null,
                id: 11,
            });
            const res = createMockRes();

            await handler({ body: { token: 12345 } }, res);

            // non-string token is ignored, goes to create
            expect(mockFindUnique).not.toHaveBeenCalled();
            expect(mockCreate).toHaveBeenCalled();
        });

        it('should return 500 on DB error', async () => {
            mockCreate.mockRejectedValue(new Error('DB error'));
            const res = createMockRes();

            await handler({ body: {} }, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    // ─── PUT /guest/name ───

    describe('PUT /guest/name', () => {
        const handler = getHandler('put', '/guest/name');

        it('should update display name successfully', async () => {
            mockFindUnique.mockResolvedValue({ id: 1 });
            mockUpdate.mockResolvedValue({});
            const res = createMockRes();

            await handler({ body: { token: 'valid-token', displayName: 'NewName' } }, res);

            expect(mockUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { displayName: 'NewName' },
            });
            expect(res.json).toHaveBeenCalledWith({ displayName: 'NewName' });
        });

        it('should return 400 when token is missing', async () => {
            const res = createMockRes();

            await handler({ body: { displayName: 'Test' } }, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token required' });
        });

        it('should return 400 when displayName is missing', async () => {
            const res = createMockRes();

            await handler({ body: { token: 'valid-token' } }, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'displayName required' });
        });

        it('should return 404 when guest not found', async () => {
            mockFindUnique.mockResolvedValue(null);
            const res = createMockRes();

            await handler({ body: { token: 'bad-token', displayName: 'Test' } }, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Guest not found' });
        });

        it('should trim and truncate displayName to 15 chars', async () => {
            mockFindUnique.mockResolvedValue({ id: 1 });
            mockUpdate.mockResolvedValue({});
            const res = createMockRes();

            await handler({
                body: { token: 'valid-token', displayName: '  ThisIsAVeryLongDisplayName  ' },
            }, res);

            expect(mockUpdate).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { displayName: 'ThisIsAVeryLong' }, // trimmed then truncated to 15
            });
        });

        it('should return 400 when body is undefined', async () => {
            const res = createMockRes();

            await handler({ body: undefined }, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 500 on DB error', async () => {
            mockFindUnique.mockRejectedValue(new Error('DB error'));
            const res = createMockRes();

            await handler({ body: { token: 'valid-token', displayName: 'Test' } }, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});
