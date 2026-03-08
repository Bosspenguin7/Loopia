import { BaseRoom, RoomConfig } from "./BaseRoom";
import { ROOM_TYPES, PLAYER_SPEED, MAX_CLIENTS } from "@shared/constants";

export class SecondMapRoom extends BaseRoom {
    maxClients = MAX_CLIENTS;

    private roomLabel: string = "";

    protected getRoomConfig(): RoomConfig {
        return {
            obstacleKey: ROOM_TYPES.SECONDMAP,
            speed: PLAYER_SPEED,
            logPrefix: 'MAP2',
            welcomeMsg: 'entered the second map!',
            leaveMsg: 'left the second map.',
        };
    }

    protected onRoomCreate(options: any) {
        this.roomLabel = options.roomLabel || "Unknown";
    }
}
