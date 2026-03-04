import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  storeAuthTokens,
  type AuthTokens,
} from "./auth-storage";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const REFRESH_PATH = (import.meta.env.VITE_AUTH_REFRESH_PATH as string | undefined)?.trim()
  || "/api/v1/auth/refresh";

function getApiBaseUrl() {
  if (!API_URL) return null;
  return API_URL.replace(/\/+$/, "");
}

function normalizeRefreshPath() {
  return REFRESH_PATH.startsWith("/") ? REFRESH_PATH : `/${REFRESH_PATH}`;
}

function asAuthTokens(data: unknown): AuthTokens | null {
  if (!data || typeof data !== "object") return null;
  const parsed = data as Partial<AuthTokens>;
  if (!parsed.accessToken || !parsed.refreshToken) return null;
  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
  };
}

async function parseBodySafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

let refreshingPromise: Promise<boolean> | null = null;

async function refreshAuthTokens(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    const apiBase = getApiBaseUrl();
    const refreshToken = getRefreshToken();
    if (!apiBase || !refreshToken) return false;

    const res = await fetch(`${apiBase}${normalizeRefreshPath()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuthTokens();
      return false;
    }

    const data = await parseBodySafe(res);
    const tokens = asAuthTokens(data);
    if (!tokens) {
      clearAuthTokens();
      return false;
    }

    storeAuthTokens(tokens);
    return true;
  })();

  try {
    return await refreshingPromise;
  } finally {
    refreshingPromise = null;
  }
}

export async function fetchWithAuthRetry(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });
  if (response.status !== 401) return response;

  const refreshed = await refreshAuthTokens();
  if (!refreshed) return response;

  const retryHeaders = new Headers(init.headers ?? {});
  const nextToken = getAccessToken();
  if (nextToken && !retryHeaders.has("Authorization")) {
    retryHeaders.set("Authorization", `Bearer ${nextToken}`);
  }

  response = await fetch(input, { ...init, headers: retryHeaders });
  return response;
}

export { getApiBaseUrl, parseBodySafe };
