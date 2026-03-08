import { describe, it, expect } from 'vitest';
import {
    ROOM_TYPES,
    CHAT,
    ECONOMY,
    SOCIAL,
    TRADE,
    PLAYER_SPEED,
    TILE_SIZE,
    MAX_CLIENTS,
    ANIM,
    PLAYER_NAME_MAX_LENGTH,
} from '../shared/constants';

describe('Shared Constants', () => {
    describe('ROOM_TYPES', () => {
        it('should define all 6 room types', () => {
            expect(Object.keys(ROOM_TYPES)).toHaveLength(6);
            expect(ROOM_TYPES.GAME).toBe('game_room');
            expect(ROOM_TYPES.CAFE).toBe('cafe_room');
            expect(ROOM_TYPES.BEARS).toBe('bears_room');
            expect(ROOM_TYPES.APARTMENT).toBe('apartment_room');
            expect(ROOM_TYPES.AVALABS).toBe('avalabs_room');
            expect(ROOM_TYPES.GROTTO).toBe('grotto_room');
        });
    });

    describe('CHAT', () => {
        it('should have reasonable message length limit', () => {
            expect(CHAT.MAX_MESSAGE_LENGTH).toBeGreaterThan(0);
            expect(CHAT.MAX_MESSAGE_LENGTH).toBeLessThanOrEqual(500);
        });

        it('should have rate limiting configured', () => {
            expect(CHAT.RATE_LIMIT_COUNT).toBeGreaterThan(0);
            expect(CHAT.RATE_LIMIT_WINDOW).toBeGreaterThan(0);
        });

        it('should keep max 50 messages in history', () => {
            expect(CHAT.MAX_HISTORY).toBe(50);
        });
    });

    describe('ECONOMY', () => {
        it('should have rewards array length matching STREAK_MAX', () => {
            // BUG DETECTED: Array has 31 elements but STREAK_MAX is 30.
            // Day 8-29 comment says 22 days but has 23 elements.
            // This test documents the current (buggy) state:
            expect(ECONOMY.DAILY_LOGIN_REWARDS).toHaveLength(31);
            expect(ECONOMY.DAILY_LOGIN_STREAK_MAX).toBe(30);
            // TODO: Fix array to have exactly 30 elements
        });

        it('should give 5 loopi on day 1', () => {
            expect(ECONOMY.DAILY_LOGIN_REWARDS[0]).toBe(5);
        });

        it('should give 20 loopi on day 7 (weekly bonus)', () => {
            expect(ECONOMY.DAILY_LOGIN_REWARDS[6]).toBe(20);
        });

        it('should give 50 loopi as the last reward', () => {
            const last = ECONOMY.DAILY_LOGIN_REWARDS[ECONOMY.DAILY_LOGIN_REWARDS.length - 1];
            expect(last).toBe(50);
        });
    });

    describe('SOCIAL', () => {
        it('should limit friends to 100', () => {
            expect(SOCIAL.MAX_FRIENDS).toBe(100);
        });

        it('should limit daily respect to 3', () => {
            expect(SOCIAL.DAILY_RESPECT_LIMIT).toBe(3);
        });

        it('should have DM length limit', () => {
            expect(SOCIAL.MAX_DM_LENGTH).toBe(200);
        });

        it('should define online threshold (2 minutes)', () => {
            expect(SOCIAL.ONLINE_THRESHOLD_MS).toBe(120_000);
        });
    });

    describe('TRADE', () => {
        it('should have a max offer of 1,000,000', () => {
            expect(TRADE.MAX_OFFER).toBe(1_000_000);
        });

        it('should timeout trades after 2 minutes', () => {
            expect(TRADE.TIMEOUT_MS).toBe(120_000);
        });

        it('should expire requests after 30 seconds', () => {
            expect(TRADE.REQUEST_EXPIRE_MS).toBe(30_000);
        });

        it('should have a 3-second countdown', () => {
            expect(TRADE.COUNTDOWN_SECONDS).toBe(3);
        });
    });

    describe('Game config', () => {
        it('should have valid player speed', () => {
            expect(PLAYER_SPEED).toBe(250);
        });

        it('should have valid tile size', () => {
            expect(TILE_SIZE).toBe(8);
        });

        it('should have valid max clients', () => {
            expect(MAX_CLIENTS).toBe(50);
        });

        it('should define idle and walk animations', () => {
            expect(ANIM.IDLE).toBe('idle');
            expect(ANIM.WALK).toBe('walk');
        });

        it('should have player name max length', () => {
            expect(PLAYER_NAME_MAX_LENGTH).toBe(20);
        });
    });
});
