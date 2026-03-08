import { BaseRoom, RoomConfig } from "./BaseRoom";
import { ROOM_TYPES, PLAYER_SPEED, MAX_CLIENTS } from "@shared/constants";

export class ApartmentRoom extends BaseRoom {
    maxClients = MAX_CLIENTS;

    private roomLabel: string = "";

    protected getRoomConfig(): RoomConfig {
        return {
            obstacleKey: ROOM_TYPES.APARTMENT,
            speed: PLAYER_SPEED,
            logPrefix: 'APT',
            welcomeMsg: 'entered the apartment!',
            leaveMsg: 'left the apartment.',
        };
    }

    protected onRoomCreate(options: any) {
        this.roomLabel = options.roomLabel || "Unknown";
    }
}
