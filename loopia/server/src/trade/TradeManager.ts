import crypto from "crypto";

export interface TradeOffer {
    loopi: number;
}

export interface ActiveTrade {
    id: string;
    sessionA: string;
    sessionB: string;
    guestIdA: number;
    guestIdB: number;
    offerA: TradeOffer;
    offerB: TradeOffer;
    readyA: boolean;
    readyB: boolean;
    confirmedA: boolean;
    confirmedB: boolean;
    lastActivity: number;
    countdownTimer?: ReturnType<typeof setTimeout>;
}

export class TradeManager {
    /** sessionId → trade */
    private trades = new Map<string, ActiveTrade>();
    /** targetSession → fromSession (pending requests) */
    private pendingRequests = new Map<string, string>();
    /** targetSession → expire timer */
    private requestTimers = new Map<string, ReturnType<typeof setTimeout>>();

    // ─── Pending Requests ───

    hasPendingRequest(sessionId: string): boolean {
        // Check if this session has an outgoing request
        for (const [_target, from] of this.pendingRequests) {
            if (from === sessionId) return true;
        }
        return false;
    }

    /** Get the fromSessionId of an incoming request for this target */
    getRequest(targetSession: string): string | undefined {
        return this.pendingRequests.get(targetSession);
    }

    addRequest(fromSession: string, toSession: string): void {
        this.pendingRequests.set(toSession, fromSession);
    }

    removeRequest(toSession: string): void {
        this.pendingRequests.delete(toSession);
        const timer = this.requestTimers.get(toSession);
        if (timer) {
            clearTimeout(timer);
            this.requestTimers.delete(toSession);
        }
    }

    setRequestTimer(toSession: string, timer: ReturnType<typeof setTimeout>): void {
        this.requestTimers.set(toSession, timer);
    }

    /** Remove all requests involving a session (both incoming and outgoing).
     *  Returns target sessionIds of outgoing requests that were removed. */
    removeAllRequests(sessionId: string): string[] {
        const removedTargets: string[] = [];
        // Remove where session is the target
        this.removeRequest(sessionId);
        // Remove where session is the sender
        for (const [target, from] of this.pendingRequests) {
            if (from === sessionId) {
                removedTargets.push(target);
                this.removeRequest(target);
            }
        }
        return removedTargets;
    }

    // ─── Active Trades ───

    isInTrade(sessionId: string): boolean {
        return this.trades.has(sessionId);
    }

    createTrade(sessionA: string, sessionB: string, guestIdA: number, guestIdB: number): ActiveTrade {
        const trade: ActiveTrade = {
            id: crypto.randomUUID(),
            sessionA,
            sessionB,
            guestIdA,
            guestIdB,
            offerA: { loopi: 0 },
            offerB: { loopi: 0 },
            readyA: false,
            readyB: false,
            confirmedA: false,
            confirmedB: false,
            lastActivity: Date.now(),
        };
        this.trades.set(sessionA, trade);
        this.trades.set(sessionB, trade);
        return trade;
    }

    getTrade(sessionId: string): ActiveTrade | undefined {
        return this.trades.get(sessionId);
    }

    getSide(trade: ActiveTrade, sessionId: string): "A" | "B" {
        return sessionId === trade.sessionA ? "A" : "B";
    }

    getPartnerSession(trade: ActiveTrade, sessionId: string): string {
        return sessionId === trade.sessionA ? trade.sessionB : trade.sessionA;
    }

    setOffer(sessionId: string, offer: TradeOffer): boolean {
        const trade = this.trades.get(sessionId);
        if (!trade) return false;

        const side = this.getSide(trade, sessionId);
        trade[`offer${side}`] = { ...offer };

        // Reset ready flags when offer changes
        const wasReady = trade.readyA || trade.readyB;
        trade.readyA = false;
        trade.readyB = false;
        trade.confirmedA = false;
        trade.confirmedB = false;

        // Clear countdown if running
        if (trade.countdownTimer) {
            clearTimeout(trade.countdownTimer);
            trade.countdownTimer = undefined;
        }

        trade.lastActivity = Date.now();
        return wasReady;
    }

    setReady(sessionId: string): { bothReady: boolean } {
        const trade = this.trades.get(sessionId);
        if (!trade) return { bothReady: false };

        const side = this.getSide(trade, sessionId);
        trade[`ready${side}`] = true;
        trade.lastActivity = Date.now();

        return { bothReady: trade.readyA && trade.readyB };
    }

    setUnready(sessionId: string): void {
        const trade = this.trades.get(sessionId);
        if (!trade) return;

        const side = this.getSide(trade, sessionId);
        trade[`ready${side}`] = false;
        trade.confirmedA = false;
        trade.confirmedB = false;

        if (trade.countdownTimer) {
            clearTimeout(trade.countdownTimer);
            trade.countdownTimer = undefined;
        }

        trade.lastActivity = Date.now();
    }

    setConfirm(sessionId: string): { bothConfirmed: boolean } {
        const trade = this.trades.get(sessionId);
        if (!trade) return { bothConfirmed: false };

        const side = this.getSide(trade, sessionId);
        trade[`confirmed${side}`] = true;
        trade.lastActivity = Date.now();

        return { bothConfirmed: trade.confirmedA && trade.confirmedB };
    }

    removeTrade(sessionId: string): ActiveTrade | undefined {
        const trade = this.trades.get(sessionId);
        if (!trade) return undefined;

        if (trade.countdownTimer) {
            clearTimeout(trade.countdownTimer);
            trade.countdownTimer = undefined;
        }

        this.trades.delete(trade.sessionA);
        this.trades.delete(trade.sessionB);
        return trade;
    }

    /** Returns list of expired trades (both session IDs) */
    getExpiredTrades(timeoutMs: number): ActiveTrade[] {
        const now = Date.now();
        const expired: ActiveTrade[] = [];
        const seen = new Set<string>();

        for (const [_sessionId, trade] of this.trades) {
            if (seen.has(trade.id)) continue;
            seen.add(trade.id);
            if (now - trade.lastActivity > timeoutMs) {
                expired.push(trade);
            }
        }
        return expired;
    }
}
