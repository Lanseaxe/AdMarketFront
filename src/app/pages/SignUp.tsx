import { Link, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  Building2,
  Video,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { storeAuthTokens } from "../lib/auth-storage";
import { syncCurrentUserFromApi } from "../lib/user-session";

type Role = "CREATOR" | "COMPANY";

type RegisterResponse = {
  accessToken: string;
  refreshToken: string;
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const MIN_PASSWORD_LENGTH = 8;
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

  if (status === 409) return "This email is already registered.";
  if (status === 400) return "Invalid registration data. Please check your input.";

  return `Registration failed (HTTP ${status}).`;
}

function saveAuthMeta(role: Role, fullName: string) {
  localStorage.setItem("role", role);

  const trimmedName = fullName.trim();
  if (trimmedName) {
    localStorage.setItem("fullName", trimmedName);
  }
}

async function registerRequest(payload: {
  email: string;
  password: string;
  role: Role;
}): Promise<RegisterResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    throw new Error("VITE_API_URL is not set. Add it to your .env file.");
  }

  const res = await fetch(`${apiBase}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) throw new Error(getErrorMessage(res.status, data));

  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid response.");
  }

  const { accessToken, refreshToken } = data as Partial<RegisterResponse>;

  if (!accessToken || !refreshToken) {
    throw new Error("Backend did not return accessToken/refreshToken.");
  }

  return { accessToken, refreshToken };
}

export default function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("CREATOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = useMemo(() => password.length > 0 && password === password2, [password, password2]);
  const passwordLengthValid =
    password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;

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
            <Link to="/signin" className="text-sm text-gray-700 hover:text-gray-900">
              Sign in
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
              Create your account
            </div>

            <h1 className="mt-6 text-4xl font-bold text-gray-900 leading-tight">
              Join <span className="text-[#1E3A8A]">AdMarket</span> today
            </h1>

            <p className="mt-4 text-gray-600 text-lg">
              Set up your profile and start matching with creators in minutes.
            </p>

            <div className="mt-8 space-y-3 text-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                Discover creators that match your audience
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                Compare predicted performance before you commit
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                Keep everything organized in one dashboard
              </div>
            </div>
          </div>

          <Card className="p-8 border border-gray-200 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Create account</h2>
            <p className="text-gray-600 mt-1">It only takes a minute.</p>

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
                if (!passwordLengthValid) {
                  setError(`Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`);
                  return;
                }
                if (!passwordsMatch) {
                  setError("Passwords do not match.");
                  return;
                }
                if (!agreed) {
                  setError("You must agree to the Terms and Privacy Policy.");
                  return;
                }

                try {
                  setLoading(true);

                  const tokens = await registerRequest({
                    email: normalizedEmail,
                    password: normalizedPassword,
                    role,
                  });

                  storeAuthTokens(tokens);
                  await syncCurrentUserFromApi();
                  saveAuthMeta(role, fullName);

                  navigate("/confirm-email", {
                    state: { email: normalizedEmail },
                  });
                } catch (err: any) {
                  setError(err?.message || "Registration failed.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {/* Role selector */}
              <div>
                <label className="text-sm font-medium text-gray-700">I am registering as</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("CREATOR")}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                      role === "CREATOR"
                        ? "border-[#3B82F6] bg-[#EFF6FF] ring-2 ring-[#3B82F6]/20"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Video className="w-4 h-4 text-gray-600" />
                      Creator
                    </div>
                    <div className="mt-1 text-xs text-gray-600">I create content and want brand deals</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("COMPANY")}
                    className={[
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                      role === "COMPANY"
                        ? "border-[#3B82F6] bg-[#EFF6FF] ring-2 ring-[#3B82F6]/20"
                        : "border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      Company
                    </div>
                    <div className="mt-1 text-xs text-gray-600">I represent a business hiring creators</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {role === "COMPANY" ? "Company name" : "Full name"}
                </label>
                <div className="mt-2 relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === "COMPANY" ? "Acme Inc." : "John Doe"}
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  />
                </div>
              </div>

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
                    placeholder="Create a strong password"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={MAX_PASSWORD_LENGTH}
                  />
                </div>
                {!passwordLengthValid && password.length > 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    Password must be {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} characters
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Confirm password</label>
                <div className="mt-2 relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={MAX_PASSWORD_LENGTH}
                  />
                </div>
                {!passwordsMatch && password2.length > 0 && (
                  <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <span className="text-[#3B82F6] hover:underline cursor-pointer">Terms</span> and{" "}
                  <span className="text-[#3B82F6] hover:underline cursor-pointer">Privacy Policy</span>.
                </span>
              </label>

              <Button
                type="submit"
                disabled={loading || !passwordLengthValid || !passwordsMatch || !agreed}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
              >
                {loading ? "Creating..." : "Create account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Already have an account?{" "}
                <Link to="/signin" className="text-[#3B82F6] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
