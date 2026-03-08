import { BaseRoom, RoomConfig } from "./BaseRoom";
import { ROOM_TYPES, PLAYER_SPEED, MAX_CLIENTS } from "@shared/constants";

export class GrottoRoom extends BaseRoom {
    maxClients = MAX_CLIENTS;

    private roomLabel: string = "";

    protected getRoomConfig(): RoomConfig {
        return {
            obstacleKey: ROOM_TYPES.GROTTO,
            speed: PLAYER_SPEED,
            logPrefix: 'GRT',
            welcomeMsg: 'entered the Grotto!',
            leaveMsg: 'left the Grotto.',
        };
    }

    protected onRoomCreate(options: any) {
        this.roomLabel = options.roomLabel || "Unknown";
    }
}
