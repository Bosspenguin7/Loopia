import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class ChatMessage extends Schema {
    @type("string") sender: string = "";
    @type("string") message: string = "";
    @type("number") timestamp: number = 0;
}

export class Player extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("string") anim: string = "idle";
    @type("string") name: string = "Player";
    @type("number") guestId: number = 0;

    // Server-only fields (no @type = not synced to clients)
    currentPath: { x: number; y: number }[] = [];
    pathIndex: number = 0;
}

export class GameState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
}
