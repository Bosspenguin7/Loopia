export const ROOM_TYPES = {
    GAME: 'game_room',
    CAFE: 'cafe_room',
    BEARS: 'bears_room',
    APARTMENT: 'apartment_room',
    AVALABS: 'avalabs_room',
    GROTTO: 'grotto_room',
} as const;

export const PLAYER_SPEED = 55;
export const TILE_SIZE = 8;
export const MAX_CLIENTS = 50;
export const GAME_LOOP_INTERVAL = 50;

export const ANIM = {
    IDLE: 'idle',
    WALK: 'walk',
    WALK_UP: 'walk_up',
    WALK_DOWN: 'walk_down',
    WALK_LEFT: 'walk_left',
    WALK_RIGHT: 'walk_right',
} as const;

export const CHAT = {
    MAX_MESSAGE_LENGTH: 200,
    MAX_HISTORY: 50,
    RATE_LIMIT_COUNT: 30,
    RATE_LIMIT_WINDOW: 60000,
} as const;

export const PLAYER_NAME_MAX_LENGTH = 20;

export const ECONOMY = {
    DAILY_LOGIN_REWARDS: [
        5, 5, 5, 5, 5, 5,   // day 1-6: 5 ducket
        20,                   // day 7: 20 ducket
        5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, // day 8-29: 5 ducket
        50,                   // day 30: 50 ducket
    ] as readonly number[],
    DAILY_LOGIN_STREAK_MAX: 30,
    ECONOMY_RATE_LIMIT_COUNT: 10,
    ECONOMY_RATE_LIMIT_WINDOW: 60000,
} as const;

export const SOCIAL = {
    WHISPER_RATE_LIMIT_COUNT: 10,
    WHISPER_RATE_LIMIT_WINDOW: 60000,
    FRIEND_REQUEST_RATE_LIMIT_COUNT: 5,
    FRIEND_REQUEST_RATE_LIMIT_WINDOW: 60000,
    MAX_FRIENDS: 100,
    ONLINE_THRESHOLD_MS: 2 * 60 * 1000,
    MAX_DM_LENGTH: 200,
    DM_RATE_LIMIT_COUNT: 10,
    DM_RATE_LIMIT_WINDOW: 60000,
    BLOCK_RATE_LIMIT_COUNT: 5,
    BLOCK_RATE_LIMIT_WINDOW: 60000,
    DAILY_RESPECT_LIMIT: 3,
    RESPECT_RATE_LIMIT_COUNT: 5,
    RESPECT_RATE_LIMIT_WINDOW: 60000,
} as const;

export const TRADE = {
    RATE_LIMIT_COUNT: 5,
    RATE_LIMIT_WINDOW: 60000,
    TIMEOUT_MS: 120_000,
    COUNTDOWN_SECONDS: 3,
    REQUEST_EXPIRE_MS: 30_000,
    MAX_OFFER: 1_000_000,
} as const;

export const SHOP = {
    PURCHASE_RATE_LIMIT_COUNT: 5,
    PURCHASE_RATE_LIMIT_WINDOW: 60000,
    WITHDRAW_RATE_LIMIT_COUNT: 3,
    WITHDRAW_RATE_LIMIT_WINDOW: 60000,
    SNOWTRACE_TX_URL: 'https://testnet.snowtrace.io/tx/',
    SNOWTRACE_ADDR_URL: 'https://testnet.snowtrace.io/address/',
} as const;

export const QUEST = {
    SUBMIT_RATE_LIMIT_COUNT: 5,
    SUBMIT_RATE_LIMIT_WINDOW: 60000,
    CATCH_RATE_LIMIT_COUNT: 10,
    CATCH_RATE_LIMIT_WINDOW: 60000,
    FISHING_DURATION_MS: 3000,
    GROTTO_STREAK_FOR_BADGE: 7,
    MAX_LINK_LENGTH: 500,
} as const;

export const LEVELING = {
    MAX_LEVEL: 100,
    xpForLevel(level: number): number {
        return 100 * level * level;
    },
    levelFromXp(xp: number): number {
        if (xp <= 0) return 1;
        const lvl = Math.floor(Math.sqrt(xp / 100));
        return Math.max(1, Math.min(lvl, 100));
    },
} as const;
