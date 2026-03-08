export interface Room {
  id: number;
  name: string;
  displayName: string;
  maxClients: number;
  roomType: string;
  sceneKey: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomStatus extends Room {
  clients: number;
  colyseusRoomIds: string[];
}

export interface PlayerInfo {
  sessionId: string;
  name: string;
  x: number;
  y: number;
  roomId: string;
}

export interface PlayerSession {
  id: number;
  sessionId: string;
  name: string;
  roomName: string;
  roomType: string;
  ip: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface BanEntry {
  id: number;
  identifier: string;
  reason: string;
  bannedAt: string;
  expiresAt: string | null;
}

export interface SystemMessage {
  id: number;
  message: string;
  targetRoom: string | null;
  active: boolean;
  createdAt: string;
}

export interface Stats {
  onlineCount: number;
  todaySessions: number;
  currentActive: number;
  recentSessions: PlayerSession[];
}

export interface UserListItem {
  id: number;
  displayName: string;
  loopi: number;
  level: number;
  xp: number;
  createdAt: string;
  lastSeenAt: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserProfile {
  id: number;
  displayName: string;
  motto: string;
  respectsReceived: number;
  loopi: number;
  level: number;
  xp: number;
  loginStreak: number;
  lastLoginRewardAt: string | null;
  createdAt: string;
  lastSeenAt: string;
  transactions: {
    id: number;
    currency: string;
    amount: number;
    reason: string;
    balanceAfter: number;
    createdAt: string;
  }[];
}
