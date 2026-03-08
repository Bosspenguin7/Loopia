import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../loopia/server/src/db/prisma', () => ({
    default: {
        account: {
            findUnique: vi.fn(),
        },
    },
}));

import prisma from '../server/src/db/prisma';
import { resolveGuest, SocialRequest } from '../server/src/social/socialAuth';
import type { Response, NextFunction } from 'express';

const mockFindUnique = prisma.account.findUnique as ReturnType<typeof vi.fn>;

function createMockReqRes(body?: Record<string, any>, query?: Record<string, any>) {
    const req = { body: body ?? {}, query: query ?? {} } as SocialRequest;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    return { req, res, next };
}

describe('socialAuth — resolveGuest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 when no token is provided', async () => {
        const { req, res, next } = createMockReqRes();

        await resolveGuest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is not a string', async () => {
        const { req, res, next } = createMockReqRes({ token: 12345 });

        await resolveGuest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is not found in DB', async () => {
        mockFindUnique.mockResolvedValue(null);
        const { req, res, next } = createMockReqRes({ token: 'invalid-token' });

        await resolveGuest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should set guestId and guestName and call next on valid token', async () => {
        mockFindUnique.mockResolvedValue({ id: 42, displayName: 'TestUser' });
        const { req, res, next } = createMockReqRes({ token: 'valid-token' });

        await resolveGuest(req, res, next);

        expect(req.guestId).toBe(42);
        expect(req.guestName).toBe('TestUser');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should fall back to Guest{id} when displayName is null', async () => {
        mockFindUnique.mockResolvedValue({ id: 7, displayName: null });
        const { req, res, next } = createMockReqRes({ token: 'valid-token' });

        await resolveGuest(req, res, next);

        expect(req.guestName).toBe('Guest7');
        expect(next).toHaveBeenCalled();
    });

    it('should read token from query if not in body', async () => {
        mockFindUnique.mockResolvedValue({ id: 10, displayName: 'QueryUser' });
        const { req, res, next } = createMockReqRes({}, { token: 'query-token' });

        await resolveGuest(req, res, next);

        expect(mockFindUnique).toHaveBeenCalledWith({ where: { guestToken: 'query-token' } });
        expect(req.guestId).toBe(10);
        expect(next).toHaveBeenCalled();
    });

    it('should return 500 on DB error', async () => {
        mockFindUnique.mockRejectedValue(new Error('DB connection lost'));
        const { req, res, next } = createMockReqRes({ token: 'valid-token' });

        await resolveGuest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is empty string', async () => {
        const { req, res, next } = createMockReqRes({ token: '' });

        await resolveGuest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token required' });
    });
});
