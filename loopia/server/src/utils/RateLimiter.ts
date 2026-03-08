export class RateLimiter {
    private timestamps: Map<string, number[]> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number, windowMs: number) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    isAllowed(key: string): boolean {
        const now = Date.now();
        let timestamps = this.timestamps.get(key) || [];

        // Remove timestamps outside the window
        timestamps = timestamps.filter(t => now - t < this.windowMs);

        if (timestamps.length >= this.maxRequests) {
            this.timestamps.set(key, timestamps);
            return false;
        }

        timestamps.push(now);
        this.timestamps.set(key, timestamps);
        return true;
    }

    reset(key: string): void {
        this.timestamps.delete(key);
    }

    resetAll(): void {
        this.timestamps.clear();
    }

    getRemainingRequests(key: string): number {
        const now = Date.now();
        const timestamps = this.timestamps.get(key) || [];
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
        return Math.max(0, this.maxRequests - validTimestamps.length);
    }
}
