import { BaseRoom, RoomConfig } from "./BaseRoom";
import { ROOM_TYPES, PLAYER_SPEED, MAX_CLIENTS } from "@shared/constants";

export class BearsAndSalmonRoom extends BaseRoom {
    maxClients = MAX_CLIENTS;

    private roomLabel: string = "";

    protected getRoomConfig(): RoomConfig {
        return {
            obstacleKey: ROOM_TYPES.BEARS,
            speed: PLAYER_SPEED,
            logPrefix: 'BEARS',
            welcomeMsg: 'joined Bears & Salmon!',
            leaveMsg: 'left Bears & Salmon.',
        };
    }

    protected onRoomCreate(options: any) {
        this.roomLabel = options.roomLabel || "Unknown";
    }
}
