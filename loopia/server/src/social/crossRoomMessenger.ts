import { matchMaker } from "colyseus";

/**
 * Deliver a message to a specific guestId across all rooms.
 * Searches all live rooms for a player with the matching guestId and sends the message.
 * Returns true if delivered, false if player not found (offline).
 */
export async function deliverToGuestId(
    targetGuestId: number,
    messageType: string,
    payload: any
): Promise<boolean> {
    try {
        const liveRooms = await matchMaker.query({});

        for (const lr of liveRooms) {
            try {
                // getLocalRoomById returns the actual Room instance (with state & clients)
                // getRoomById only returns RoomCache metadata — no state/clients
                const room = matchMaker.getLocalRoomById(lr.roomId);
                if (!room) continue;

                const state = (room as any).state;
                if (!state?.players) continue;

                // Search through players in this room
                let found = false;
                state.players.forEach((player: any, sessionId: string) => {
                    if (player.guestId === targetGuestId) {
                        const client = room.clients.getById(sessionId);
                        if (client) {
                            client.send(messageType, payload);
                            found = true;
                        }
                    }
                });

                if (found) return true;
            } catch (err) {
                console.error("[CrossRoom] Error checking room:", lr.roomId, err);
            }
        }

        return false;
    } catch (e) {
        console.error("[CrossRoom] deliverToGuestId error:", e);
        return false;
    }
}
