import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "./api-client";
import { storeCurrentUser, type CurrentUser } from "./user-session";

export type BasicUserProfile = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR" | string;
  status: "ACTIVE" | string;
  avatar?: string | null;
};

type ProfileWithAvatar = {
  avatar?: string | null;
};

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

function ensureBasicUserProfile(data: unknown): BasicUserProfile | null {
  if (!data || typeof data !== "object") return null;

  const item = data as Partial<BasicUserProfile>;
  if (
    typeof item.id !== "number" ||
    typeof item.email !== "string" ||
    typeof item.role !== "string" ||
    typeof item.status !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    email: item.email,
    role: item.role,
    status: item.status,
    avatar: extractAvatarValue(data),
  };
}

function requireApiBase() {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
  return apiBase;
}

function looksLikeRawBase64(value: string) {
  const normalized = value.replace(/\s+/g, "");
  if (!normalized || normalized.length < 16 || normalized.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/=]+$/.test(normalized);
}

function inferBase64ImageMimeType(value: string) {
  const normalized = value.replace(/\s+/g, "");
  if (normalized.startsWith("/9j/")) return "image/jpeg";
  if (normalized.startsWith("iVBOR")) return "image/png";
  if (normalized.startsWith("R0lGOD")) return "image/gif";
  if (normalized.startsWith("UklGR")) return "image/webp";
  if (normalized.startsWith("PHN2Zy") || normalized.startsWith("PD94bWw")) return "image/svg+xml";
  return "image/png";
}

export function resolveUserAvatarUrl(avatar?: string | null) {
  const trimmed = avatar?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (looksLikeRawBase64(trimmed)) {
    const normalized = trimmed.replace(/\s+/g, "");
    return `data:${inferBase64ImageMimeType(normalized)};base64,${normalized}`;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    const apiBase = getApiBaseUrl();
    if (!apiBase) return trimmed;
    return new URL(trimmed.replace(/^\/+/, ""), `${apiBase}/`).toString();
  }
}

export async function fetchUserById(userId: number): Promise<BasicUserProfile | null> {
  const apiBase = requireApiBase();
  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/user/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load user (HTTP ${res.status})`);

  const parsed = ensureBasicUserProfile(data);
  if (!parsed) throw new Error("Invalid user response from backend.");
  return parsed;
}

async function fetchProfileByRole(userId: number, role: string): Promise<ProfileWithAvatar | null> {
  const apiBase = requireApiBase();
  const normalizedRole = role.toUpperCase();
  const path =
    normalizedRole === "CREATOR"
      ? `/api/v1/creator/user/${userId}`
      : normalizedRole === "COMPANY"
        ? `/api/v1/company/user/${userId}`
        : null;

  if (!path) return null;

  const res = await fetchWithAuthRetry(`${apiBase}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load ${normalizedRole.toLowerCase()} profile (HTTP ${res.status})`);
  }
  if (!data || typeof data !== "object") return null;

  return {
    avatar: extractAvatarValue(data),
  };
}

export async function fetchAvatarByRoleAndUserId(userId: number, role: string): Promise<string | null> {
  const profile = await fetchProfileByRole(userId, role);
  return typeof profile?.avatar === "string" && profile.avatar.trim() ? profile.avatar : null;
}

export async function uploadUserAvatar(userId: number, file: File): Promise<CurrentUser> {
  const apiBase = requireApiBase();
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/user/${userId}/avatar`, {
    method: "POST",
    body: formData,
  });
  const data = await parseBodySafe(res);

  if (!res.ok) {
    throw new Error(`Failed to upload avatar (HTTP ${res.status})`);
  }

  const parsed = ensureBasicUserProfile(data);
  if (!parsed) throw new Error("Invalid avatar upload response from backend.");

  storeCurrentUser(parsed);
  return parsed;
}
