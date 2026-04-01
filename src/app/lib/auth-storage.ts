export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type PendingProfileRedirect = {
  email: string;
  role: string;
};

const PENDING_PROFILE_KEY = "pendingProfileRedirect";
export const AUTH_STATE_CHANGED_EVENT = "auth-state-changed";

function notifyAuthStateChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
}

function clearStoredProfiles() {
  localStorage.removeItem("companyProfile");
  localStorage.removeItem("creatorProfile");
  localStorage.removeItem("companyProfileCompleted");
  localStorage.removeItem("creatorProfileCompleted");
}

export function storeAuthTokens(tokens: AuthTokens) {
  clearStoredProfiles();
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
  notifyAuthStateChanged();
}

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function clearAuthTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  notifyAuthStateChanged();
}

export function clearAuthSession() {
  clearAuthTokens();
  clearStoredProfiles();
  localStorage.removeItem("rememberMe");
  localStorage.removeItem("role");
  localStorage.removeItem("status");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("avatar");
  localStorage.removeItem("fullName");
  localStorage.removeItem("profileCompleted");
  notifyAuthStateChanged();
}

export function setPendingProfileRedirect(email: string, role: string) {
  const payload: PendingProfileRedirect = { email: email.trim().toLowerCase(), role };
  localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(payload));
}

export function consumePendingProfileRedirectForEmail(email: string) {
  const raw = localStorage.getItem(PENDING_PROFILE_KEY);
  if (!raw) return false;

  try {
    const payload = JSON.parse(raw) as Partial<PendingProfileRedirect>;
    const pendingEmail = (payload.email || "").trim().toLowerCase();
    const currentEmail = email.trim().toLowerCase();

    if (pendingEmail && pendingEmail === currentEmail) {
      localStorage.removeItem(PENDING_PROFILE_KEY);
      return true;
    }
  } catch {
    // ignore broken cache
  }

  return false;
}
