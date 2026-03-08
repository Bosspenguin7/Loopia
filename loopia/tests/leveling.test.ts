import { describe, it, expect } from 'vitest';
import { LEVELING } from '../shared/constants';

describe('LEVELING', () => {
    describe('xpForLevel', () => {
        it('should return 100 XP for level 1', () => {
            expect(LEVELING.xpForLevel(1)).toBe(100);
        });

        it('should return 400 XP for level 2', () => {
            expect(LEVELING.xpForLevel(2)).toBe(400);
        });

        it('should return 10000 XP for level 10', () => {
            expect(LEVELING.xpForLevel(10)).toBe(10000);
        });

        it('should follow quadratic formula (100 * level^2)', () => {
            for (let level = 1; level <= 20; level++) {
                expect(LEVELING.xpForLevel(level)).toBe(100 * level * level);
            }
        });

        it('should return 1000000 XP for max level 100', () => {
            expect(LEVELING.xpForLevel(100)).toBe(1_000_000);
        });
    });

    describe('levelFromXp', () => {
        it('should return level 1 for 0 XP', () => {
            expect(LEVELING.levelFromXp(0)).toBe(1);
        });

        it('should return level 1 for 99 XP (below level 1 threshold)', () => {
            expect(LEVELING.levelFromXp(99)).toBe(1);
        });

        it('should return level 1 for exactly 100 XP', () => {
            expect(LEVELING.levelFromXp(100)).toBe(1);
        });

        it('should return level 2 for 400 XP', () => {
            expect(LEVELING.levelFromXp(400)).toBe(2);
        });

        it('should return level 10 for 10000 XP', () => {
            expect(LEVELING.levelFromXp(10000)).toBe(10);
        });

        it('should not exceed MAX_LEVEL (100)', () => {
            expect(LEVELING.levelFromXp(99_999_999)).toBe(100);
        });

        it('should return 1 for negative XP', () => {
            expect(LEVELING.levelFromXp(-100)).toBe(1);
            expect(LEVELING.levelFromXp(-1)).toBe(1);
        });

        it('should be consistent with xpForLevel (roundtrip)', () => {
            for (let level = 1; level <= 50; level++) {
                const xp = LEVELING.xpForLevel(level);
                expect(LEVELING.levelFromXp(xp)).toBe(level);
            }
        });

        it('should return correct level for XP between thresholds', () => {
            // Between level 3 (900 XP) and level 4 (1600 XP)
            expect(LEVELING.levelFromXp(1000)).toBe(3);
            expect(LEVELING.levelFromXp(1500)).toBe(3);
            expect(LEVELING.levelFromXp(1599)).toBe(3);
        });
    });
});
