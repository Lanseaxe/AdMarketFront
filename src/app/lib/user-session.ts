import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "./api-client";

export type CurrentUser = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR" | string;
  status: "ACTIVE" | string;
  avatar?: string | null;
};

export const CURRENT_USER_CHANGED_EVENT = "current-user-changed";

function extractAvatarValue(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const item = data as Record<string, unknown>;
  const candidates = [
    item.avatar,
    item.avatarUrl,
    item.profilePhoto,
    item.profilePhotoUrl,
    item.photo,
    item.photoUrl,
    item.image,
    item.imageUrl,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  if (item.user && typeof item.user === "object") {
    return extractAvatarValue(item.user);
  }

  return null;
}

function notifyCurrentUserChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CURRENT_USER_CHANGED_EVENT));
  }
}

export function storeCurrentUser(user: CurrentUser) {
  localStorage.setItem("userId", String(user.id));
  localStorage.setItem("email", user.email);
  localStorage.setItem("role", user.role);
  localStorage.setItem("status", user.status);
  if (typeof user.avatar === "string" && user.avatar.trim()) {
    localStorage.setItem("avatar", user.avatar);
  } else {
    localStorage.removeItem("avatar");
  }
  notifyCurrentUserChanged();
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/user/me`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return null;

  const data = await parseBodySafe(res);
  if (!data || typeof data !== "object") return null;

  const parsed = data as Partial<CurrentUser>;
  if (
    typeof parsed.id !== "number" ||
    typeof parsed.email !== "string" ||
    typeof parsed.role !== "string" ||
    typeof parsed.status !== "string"
  ) {
    return null;
  }

  return {
    id: parsed.id,
    email: parsed.email,
    role: parsed.role,
    status: parsed.status,
    avatar: extractAvatarValue(data),
  };
}

export async function syncCurrentUserFromApi(): Promise<CurrentUser | null> {
  const user = await fetchCurrentUser();
  if (!user) return null;
  storeCurrentUser(user);
  return user;
}
