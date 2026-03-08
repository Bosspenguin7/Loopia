const getBaseUrl = (): string => {
  return "/admin/api";
};

const getPassword = (): string => {
  return sessionStorage.getItem("admin_password") || "";
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": getPassword(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem("admin_password");
    window.location.reload();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Rooms
  getRooms: () => request<any[]>("/rooms"),
  createRoom: (data: any) => request<any>("/rooms", { method: "POST", body: JSON.stringify(data) }),
  updateRoom: (id: number, data: any) => request<any>(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoom: (id: number) => request<any>(`/rooms/${id}`, { method: "DELETE" }),
  deleteRoomPermanent: (id: number) => request<any>(`/rooms/${id}?permanent=true`, { method: "DELETE" }),

  // Status
  getStatus: () => request<any[]>("/status"),
  getPlayers: (roomName: string) => request<any[]>(`/status/${roomName}/players`),

  // Moderation
  kick: (sessionId: string, roomId: string) => request<any>("/kick", { method: "POST", body: JSON.stringify({ sessionId, roomId }) }),
  getBans: () => request<any[]>("/bans"),
  addBan: (data: any) => request<any>("/bans", { method: "POST", body: JSON.stringify(data) }),
  removeBan: (id: number) => request<any>(`/bans/${id}`, { method: "DELETE" }),
  sendSystemMessage: (data: any) => request<any>("/system-message", { method: "POST", body: JSON.stringify(data) }),

  // Stats
  getStats: () => request<any>("/stats"),

  // Users
  getUsers: (params: { page?: number; limit?: number; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.q) sp.set("q", params.q);
    return request<import("../types").UserListResponse>(`/users?${sp.toString()}`);
  },
  getUserProfile: (id: number) =>
    request<import("../types").UserProfile>(`/users/${id}`),

  // Economy
  grantCurrency: (data: { guestId: number; currency: string; amount: number; reason?: string }) =>
    request<any>("/economy/grant", { method: "POST", body: JSON.stringify(data) }),

  // Quest Review
  getQuestSubmissions: (status?: string) => {
    const sp = status ? `?status=${status}` : "";
    return request<any[]>(`/quest/submissions${sp}`);
  },
  approveQuestSubmission: (submissionId: number, reviewedBy: string, notes?: string) =>
    request<any>("/quest/approve", { method: "POST", body: JSON.stringify({ submissionId, reviewedBy, notes }) }),
  rejectQuestSubmission: (submissionId: number, reviewedBy: string, notes?: string) =>
    request<any>("/quest/reject", { method: "POST", body: JSON.stringify({ submissionId, reviewedBy, notes }) }),
};
