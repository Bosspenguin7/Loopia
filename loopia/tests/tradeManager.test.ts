import { describe, it, expect, beforeEach } from 'vitest';
import { TradeManager } from '../server/src/trade/TradeManager';

describe('TradeManager', () => {
    let tm: TradeManager;

    beforeEach(() => {
        tm = new TradeManager();
    });

    // ─── Pending Requests ───

    describe('pending requests', () => {
        it('should add and retrieve a pending request', () => {
            tm.addRequest('sessionA', 'sessionB');
            expect(tm.getRequest('sessionB')).toBe('sessionA');
        });

        it('should detect outgoing pending request', () => {
            tm.addRequest('sessionA', 'sessionB');
            expect(tm.hasPendingRequest('sessionA')).toBe(true);
            expect(tm.hasPendingRequest('sessionB')).toBe(false);
        });

        it('should remove a pending request', () => {
            tm.addRequest('sessionA', 'sessionB');
            tm.removeRequest('sessionB');
            expect(tm.getRequest('sessionB')).toBeUndefined();
        });

        it('should remove all requests involving a session', () => {
            tm.addRequest('sessionA', 'sessionB'); // A → B
            tm.addRequest('sessionC', 'sessionA'); // C → A (incoming)

            const removedTargets = tm.removeAllRequests('sessionA');
            // A had outgoing to B → removed
            expect(removedTargets).toContain('sessionB');
            // A had incoming from C → also removed
            expect(tm.getRequest('sessionA')).toBeUndefined();
            expect(tm.getRequest('sessionB')).toBeUndefined();
        });
    });

    // ─── Active Trades ───

    describe('trade lifecycle', () => {
        it('should create a trade between two sessions', () => {
            const trade = tm.createTrade('sA', 'sB', 1, 2);

            expect(trade.sessionA).toBe('sA');
            expect(trade.sessionB).toBe('sB');
            expect(trade.guestIdA).toBe(1);
            expect(trade.guestIdB).toBe(2);
            expect(trade.offerA.loopi).toBe(0);
            expect(trade.offerB.loopi).toBe(0);
            expect(trade.readyA).toBe(false);
            expect(trade.readyB).toBe(false);
        });

        it('should detect players in trade', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            expect(tm.isInTrade('sA')).toBe(true);
            expect(tm.isInTrade('sB')).toBe(true);
            expect(tm.isInTrade('sC')).toBe(false);
        });

        it('should get trade by either session', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            const tradeA = tm.getTrade('sA');
            const tradeB = tm.getTrade('sB');
            expect(tradeA).toBe(tradeB); // same reference
        });

        it('should identify correct side (A or B)', () => {
            const trade = tm.createTrade('sA', 'sB', 1, 2);
            expect(tm.getSide(trade, 'sA')).toBe('A');
            expect(tm.getSide(trade, 'sB')).toBe('B');
        });

        it('should get partner session', () => {
            const trade = tm.createTrade('sA', 'sB', 1, 2);
            expect(tm.getPartnerSession(trade, 'sA')).toBe('sB');
            expect(tm.getPartnerSession(trade, 'sB')).toBe('sA');
        });
    });

    describe('offers', () => {
        it('should set an offer for a session', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            tm.setOffer('sA', { loopi: 100 });

            const trade = tm.getTrade('sA')!;
            expect(trade.offerA.loopi).toBe(100);
            expect(trade.offerB.loopi).toBe(0);
        });

        it('should reset ready flags when offer changes', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            tm.setReady('sA');
            tm.setReady('sB');

            const trade = tm.getTrade('sA')!;
            expect(trade.readyA).toBe(true);

            tm.setOffer('sA', { loopi: 50 });
            expect(trade.readyA).toBe(false);
            expect(trade.readyB).toBe(false);
        });
    });

    describe('ready and confirm', () => {
        it('should set ready for one side', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            const result = tm.setReady('sA');
            expect(result.bothReady).toBe(false);
        });

        it('should detect both ready', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            tm.setReady('sA');
            const result = tm.setReady('sB');
            expect(result.bothReady).toBe(true);
        });

        it('should unready and reset confirms', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            tm.setReady('sA');
            tm.setReady('sB');
            tm.setConfirm('sA');

            tm.setUnready('sA');
            const trade = tm.getTrade('sA')!;
            expect(trade.readyA).toBe(false);
            expect(trade.confirmedA).toBe(false);
            expect(trade.confirmedB).toBe(false);
        });

        it('should detect both confirmed', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            tm.setReady('sA');
            tm.setReady('sB');
            tm.setConfirm('sA');
            const result = tm.setConfirm('sB');
            expect(result.bothConfirmed).toBe(true);
        });
    });

    describe('remove trade', () => {
        it('should remove trade for both sessions', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            tm.removeTrade('sA');

            expect(tm.isInTrade('sA')).toBe(false);
            expect(tm.isInTrade('sB')).toBe(false);
        });

        it('should return the removed trade', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            const removed = tm.removeTrade('sA');
            expect(removed).toBeDefined();
            expect(removed!.sessionA).toBe('sA');
        });

        it('should return undefined when no trade exists', () => {
            expect(tm.removeTrade('nonexistent')).toBeUndefined();
        });
    });

    describe('expired trades', () => {
        it('should detect expired trades', () => {
            const trade = tm.createTrade('sA', 'sB', 1, 2);
            // Force lastActivity to the past
            trade.lastActivity = Date.now() - 130_000;

            const expired = tm.getExpiredTrades(120_000);
            expect(expired).toHaveLength(1);
            expect(expired[0].id).toBe(trade.id);
        });

        it('should not return active trades as expired', () => {
            tm.createTrade('sA', 'sB', 1, 2);
            const expired = tm.getExpiredTrades(120_000);
            expect(expired).toHaveLength(0);
        });

        it('should not duplicate trades in expired list', () => {
            const trade = tm.createTrade('sA', 'sB', 1, 2);
            trade.lastActivity = Date.now() - 130_000;

            const expired = tm.getExpiredTrades(120_000);
            // Trade is indexed by both sessions but should appear only once
            expect(expired).toHaveLength(1);
        });
    });
});
