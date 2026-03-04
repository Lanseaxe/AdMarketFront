import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "./api-client";

export type CurrentUser = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR" | string;
  status: "ACTIVE" | string;
};

function storeCurrentUser(user: CurrentUser) {
  localStorage.setItem("userId", String(user.id));
  localStorage.setItem("email", user.email);
  localStorage.setItem("role", user.role);
  localStorage.setItem("status", user.status);
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
  };
}

export async function syncCurrentUserFromApi(): Promise<CurrentUser | null> {
  const user = await fetchCurrentUser();
  if (!user) return null;
  storeCurrentUser(user);
  return user;
}
