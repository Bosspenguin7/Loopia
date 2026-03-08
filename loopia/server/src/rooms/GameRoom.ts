import { BaseRoom, RoomConfig, sanitizeName } from "./BaseRoom";
import { ROOM_TYPES, PLAYER_SPEED, MAX_CLIENTS } from "@shared/constants";

export class GameRoom extends BaseRoom {
    maxClients = MAX_CLIENTS;

    protected getRoomConfig(): RoomConfig {
        return {
            obstacleKey: ROOM_TYPES.GAME,
            speed: PLAYER_SPEED,
            logPrefix: 'GAME',
            welcomeMsg: 'joined the game!',
            leaveMsg: 'left the game.',
        };
    }

    protected onRoomCreate(options: any) {
        this.setMetadata({ roomLabel: options.roomLabel });
    }

    protected registerMessageHandlers() {
        this.onMessage("setName", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || !data.name) return;
            const clean = sanitizeName(data.name);
            if (!clean) return;
            player.name = clean;
            console.log(`[GAME] ${client.sessionId} set name to: ${player.name}`);
        });
    }
}
