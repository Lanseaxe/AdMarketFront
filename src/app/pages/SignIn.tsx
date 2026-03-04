import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import {
  consumePendingProfileRedirectForEmail,
  storeAuthTokens,
} from "../lib/auth-storage";
import { syncCurrentUserFromApi } from "../lib/user-session";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;

function getApiBaseUrl() {
  if (!API_URL) return null;
  return API_URL.replace(/\/+$/, "");
}

function getErrorMessage(status: number, data: unknown) {
  if (data && typeof data === "object") {
    const maybeObj = data as Record<string, unknown>;
    const directMessage =
      (typeof maybeObj.message === "string" && maybeObj.message) ||
      (typeof maybeObj.detail === "string" && maybeObj.detail) ||
      (typeof maybeObj.error === "string" && maybeObj.error);

    if (directMessage) return directMessage;

    if (Array.isArray(maybeObj.errors)) {
      const firstError = maybeObj.errors.find((item) => typeof item === "string");
      if (firstError) return firstError;
    }
  }

  if (status === 401) return "Invalid email or password.";
  if (status === 400) return "Invalid credentials format. Please check input.";

  return `Sign in failed (HTTP ${status}).`;
}

async function authenticateRequest(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetch(`${apiBase}/api/v1/auth/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) throw new Error(getErrorMessage(res.status, data));

  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid response.");
  }

  const { accessToken, refreshToken } = data as Partial<AuthResponse>;
  if (!accessToken || !refreshToken) {
    throw new Error("Backend did not return accessToken/refreshToken.");
  }

  return { accessToken, refreshToken };
}

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="text-xl font-semibold text-gray-900">AdMarket</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/signup" className="text-sm text-gray-700 hover:text-gray-900">
              Create account
            </Link>
            <Link to="/">
              <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF6FF] text-[#3B82F6] text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Secure sign in
            </div>

            <h1 className="mt-6 text-4xl font-bold text-gray-900 leading-tight">
              Welcome back to <span className="text-[#1E3A8A]">AdMarket</span>
            </h1>

            <p className="mt-4 text-gray-600 text-lg">
              Sign in to manage campaigns, review AI matches, and message creators.
            </p>

            <div className="mt-8 space-y-3 text-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                AI-powered creator matching
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                Performance predictions and risk scoring
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                Centralized conversations
              </div>
            </div>
          </div>

          <Card className="p-8 border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Sign In</h2>
            <p className="text-gray-600 mt-1">Use your email and password.</p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);

                const normalizedEmail = email.trim().toLowerCase();
                const normalizedPassword = password.trim();

                if (!getApiBaseUrl()) {
                  setError("VITE_API_URL is not set. Add it to your .env file.");
                  return;
                }
                if (!normalizedEmail) {
                  setError("Email is required.");
                  return;
                }
                if (
                  normalizedPassword.length < MIN_PASSWORD_LENGTH ||
                  normalizedPassword.length > MAX_PASSWORD_LENGTH
                ) {
                  setError(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`);
                  return;
                }

                try {
                  setLoading(true);

                  const tokens = await authenticateRequest({
                    email: normalizedEmail,
                    password: normalizedPassword,
                  });

                  storeAuthTokens(tokens);
                  const me = await syncCurrentUserFromApi();

                  if (rememberMe) {
                    localStorage.setItem("rememberMe", "true");
                  } else {
                    localStorage.removeItem("rememberMe");
                  }

                  const goToProfile = consumePendingProfileRedirectForEmail(me?.email || normalizedEmail);
                  navigate(goToProfile ? "/profile" : "/dashboard");
                } catch (err: any) {
                  setError(err?.message || "Sign in failed.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="mt-2 relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="mt-2 relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    autoComplete="current-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={MAX_PASSWORD_LENGTH}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <Link to="/forgot-password" className="text-sm text-[#3B82F6] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-[#3B82F6] hover:underline">
                  Create one
                </Link>
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
