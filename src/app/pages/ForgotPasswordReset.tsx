import { Link, useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { KeyRound, Lock, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import {
  getPasswordValidationMessage,
  normalizePassword,
  normalizePasswordInput,
} from "../lib/password-validation";

type ForgetPasswordResponse = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR";
  status: "ACTIVE" | "PENDING" | string;
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
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
  }

  if (status === 400) return "Invalid reset code or password.";
  if (status === 404) return "Account not found.";

  return `Password reset failed (HTTP ${status}).`;
}

async function resetPasswordRequest(payload: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<ForgetPasswordResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetch(`${apiBase}/api/v1/user/forget-password`, {
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
    throw new Error("Backend returned an invalid reset response.");
  }

  const parsed = data as Partial<ForgetPasswordResponse>;
  if (
    typeof parsed.id !== "number" ||
    typeof parsed.email !== "string" ||
    typeof parsed.role !== "string" ||
    typeof parsed.status !== "string"
  ) {
    throw new Error("Backend reset response is missing required fields.");
  }

  return {
    id: parsed.id,
    email: parsed.email,
    role: parsed.role as ForgetPasswordResponse["role"],
    status: parsed.status,
  };
}

export default function ForgotPasswordReset() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = (location.state as { email?: string } | null)?.email || "";
  const email = emailFromState || localStorage.getItem("resetEmail") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isValidCode = useMemo(() => /^\d{6}$/.test(code), [code]);
  const normalizedPassword = useMemo(() => normalizePassword(newPassword), [newPassword]);
  const passwordValidationMessage = useMemo(
    () => getPasswordValidationMessage(newPassword),
    [newPassword],
  );
  const isValidPassword = !passwordValidationMessage;
  const codeEmpty = code.trim().length === 0;
  const passwordEmpty = normalizedPassword.length === 0;
  const submitDisabled = loading || codeEmpty || !isValidCode || passwordEmpty || !isValidPassword || !email;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-[#1E3A8A]">AdMarket</span>
          </Link>
        </div>

        <Card className="p-8 border border-gray-200 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Set a new password</h1>
          <p className="mt-3 text-gray-600">
            Enter the 6-digit code from email and your new password.
          </p>

          {email ? (
            <p className="mt-2 text-sm text-gray-500">Resetting password for: {email}</p>
          ) : (
            <div className="mt-4 text-sm text-red-600">
              Email is missing. Start again from{" "}
              <Link to="/forgot-password" className="underline">
                Forgot Password
              </Link>
              .
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setSuccess(null);
              setCodeTouched(true);
              setPasswordTouched(true);

              if (!email) {
                setError("Email is missing. Go back and request a reset code again.");
                return;
              }
              if (!isValidCode) {
                setError("Code must contain exactly 6 digits.");
                return;
              }
              if (passwordValidationMessage) {
                setError(passwordValidationMessage);
                return;
              }

              try {
                setLoading(true);
                const user = await resetPasswordRequest({
                  email,
                  code: code.trim(),
                  newPassword: normalizedPassword,
                });

                localStorage.setItem("userId", String(user.id));
                localStorage.setItem("email", user.email);
                localStorage.setItem("role", user.role);
                localStorage.setItem("status", user.status);
                localStorage.removeItem("resetEmail");

                setSuccess("Password updated successfully. Redirecting to sign in...");
                setTimeout(() => navigate("/signin"), 1200);
              } catch (err: any) {
                setError(err?.message || "Failed to reset password.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Reset code</label>
              <div className="mt-2 relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onBlur={() => setCodeTouched(true)}
                  inputMode="numeric"
                  pattern="\d{6}"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  required
                />
              </div>
              {codeTouched && codeEmpty && (
                <p className="mt-2 text-xs text-red-600">This field cannot be empty.</p>
              )}
              {codeTouched && !codeEmpty && !isValidCode && (
                <p className="mt-2 text-xs text-red-600">Code must contain exactly 6 digits.</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">New password</label>
              <div className="mt-2 relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(normalizePasswordInput(e.target.value))}
                  onBlur={() => setPasswordTouched(true)}
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  required
                />
              </div>
              {passwordTouched && passwordEmpty && (
                <p className="mt-2 text-xs text-red-600">This field cannot be empty.</p>
              )}
              {passwordValidationMessage && !passwordEmpty && (
                <p className="mt-2 text-xs text-red-600">{passwordValidationMessage}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Spaces at the beginning and end are ignored automatically.
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitDisabled}
              className="w-full rounded-xl py-6 text-base disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
            >
              {loading ? "Updating..." : "Update password"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Back to{" "}
            <Link to="/signin" className="text-[#3B82F6] hover:underline">
              sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
