import { describe, it, expect } from 'vitest';
import { sanitizeName } from '../server/src/rooms/BaseRoom';

describe('sanitizeName', () => {
    it('should accept a valid name', () => {
        expect(sanitizeName('Alice')).toBe('Alice');
    });

    it('should trim whitespace', () => {
        expect(sanitizeName('  Bob  ')).toBe('Bob');
    });

    it('should truncate to max length (20 chars)', () => {
        const long = 'A'.repeat(30);
        expect(sanitizeName(long)).toHaveLength(20);
    });

    it('should reject empty string', () => {
        expect(sanitizeName('')).toBeNull();
    });

    it('should reject whitespace-only string', () => {
        expect(sanitizeName('   ')).toBeNull();
    });

    it('should reject "System" (case-insensitive)', () => {
        expect(sanitizeName('System')).toBeNull();
        expect(sanitizeName('system')).toBeNull();
        expect(sanitizeName('SYSTEM')).toBeNull();
    });

    it('should reject "Admin" (case-insensitive)', () => {
        expect(sanitizeName('Admin')).toBeNull();
        expect(sanitizeName('admin')).toBeNull();
    });

    it('should reject "Moderator"', () => {
        expect(sanitizeName('Moderator')).toBeNull();
    });

    it('should reject "Server"', () => {
        expect(sanitizeName('Server')).toBeNull();
    });

    it('should reject "Loopia"', () => {
        expect(sanitizeName('Loopia')).toBeNull();
        expect(sanitizeName('loopia')).toBeNull();
    });

    it('should allow names containing reserved words as substring', () => {
        expect(sanitizeName('SystemAdmin123')).toBe('SystemAdmin123');
        expect(sanitizeName('MyAdmin')).toBe('MyAdmin');
    });
});
