import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../server/src/utils/RateLimiter';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter(3, 1000); // 3 requests per 1 second
    });

    it('should allow requests within the limit', () => {
        expect(limiter.isAllowed('user1')).toBe(true);
        expect(limiter.isAllowed('user1')).toBe(true);
        expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding the limit', () => {
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        expect(limiter.isAllowed('user1')).toBe(false);
    });

    it('should track different keys independently', () => {
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');

        // user1 is exhausted, but user2 should still work
        expect(limiter.isAllowed('user1')).toBe(false);
        expect(limiter.isAllowed('user2')).toBe(true);
    });

    it('should allow requests after window expires', () => {
        vi.useFakeTimers();

        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        expect(limiter.isAllowed('user1')).toBe(false);

        // Advance time past the window
        vi.advanceTimersByTime(1001);

        expect(limiter.isAllowed('user1')).toBe(true);

        vi.useRealTimers();
    });

    it('should reset a specific key', () => {
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        expect(limiter.isAllowed('user1')).toBe(false);

        limiter.reset('user1');
        expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should reset all keys', () => {
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        limiter.isAllowed('user1');
        limiter.isAllowed('user2');
        limiter.isAllowed('user2');
        limiter.isAllowed('user2');

        limiter.resetAll();
        expect(limiter.isAllowed('user1')).toBe(true);
        expect(limiter.isAllowed('user2')).toBe(true);
    });

    it('should report remaining requests correctly', () => {
        expect(limiter.getRemainingRequests('user1')).toBe(3);
        limiter.isAllowed('user1');
        expect(limiter.getRemainingRequests('user1')).toBe(2);
        limiter.isAllowed('user1');
        expect(limiter.getRemainingRequests('user1')).toBe(1);
        limiter.isAllowed('user1');
        expect(limiter.getRemainingRequests('user1')).toBe(0);
    });

    it('should handle sliding window correctly', () => {
        vi.useFakeTimers();

        limiter.isAllowed('user1'); // t=0
        vi.advanceTimersByTime(400);
        limiter.isAllowed('user1'); // t=400
        vi.advanceTimersByTime(400);
        limiter.isAllowed('user1'); // t=800
        expect(limiter.isAllowed('user1')).toBe(false); // t=800, all 3 within window

        // Advance to t=1001 — first request (t=0) falls out of window
        vi.advanceTimersByTime(201);
        expect(limiter.isAllowed('user1')).toBe(true); // t=1001, only 2 remain in window

        vi.useRealTimers();
    });
});
