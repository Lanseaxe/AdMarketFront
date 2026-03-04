import { Link, useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MailCheck, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";

type ConfirmResponse = {
  id: number;
  email: string;
  role: "COMPANY" | "CREATOR";
  status: "ACTIVE" | "PENDING" | string;
};

function getErrorMessage(status: number, data: unknown) {
  if (data && typeof data === "object") {
    const maybeObj = data as Record<string, unknown>;
    const directMessage =
      (typeof maybeObj.message === "string" && maybeObj.message) ||
      (typeof maybeObj.detail === "string" && maybeObj.detail) ||
      (typeof maybeObj.error === "string" && maybeObj.error);

    if (directMessage) return directMessage;
  }

  if (status === 400) return "Invalid confirmation code.";
  if (status === 401) return "Unauthorized request. Please sign in again.";

  return `Confirmation failed (HTTP ${status}).`;
}

async function confirmEmailRequest(code: string): Promise<ConfirmResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/user/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await parseBodySafe(res);

  if (!res.ok) throw new Error(getErrorMessage(res.status, data));

  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid confirmation response.");
  }

  const parsed = data as Partial<ConfirmResponse>;
  if (
    typeof parsed.id !== "number" ||
    typeof parsed.email !== "string" ||
    typeof parsed.role !== "string" ||
    typeof parsed.status !== "string"
  ) {
    throw new Error("Backend confirmation response is missing required fields.");
  }

  return {
    id: parsed.id,
    email: parsed.email,
    role: parsed.role as ConfirmResponse["role"],
    status: parsed.status,
  };
}

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isValidCode = useMemo(() => /^\d{6}$/.test(code), [code]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <Link to="/signup" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFF6FF] text-[#3B82F6] text-sm font-medium">
            <MailCheck className="w-4 h-4" />
            Email confirmation required
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">Confirm your email</h1>
          <p className="mt-3 text-gray-600">
            Enter the 6-digit code sent to your email address.
            {initialEmail ? ` (${initialEmail})` : ""}
          </p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <ShieldCheck className="w-4 h-4 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setSuccess(null);

              const normalizedCode = code.trim();
              if (!isValidCode) {
                setError("Code must contain exactly 6 digits.");
                return;
              }

              try {
                setLoading(true);
                const user = await confirmEmailRequest(normalizedCode);

                localStorage.setItem("userId", String(user.id));
                localStorage.setItem("email", user.email);
                localStorage.setItem("role", user.role);
                localStorage.setItem("status", user.status);

                setSuccess("Email confirmed successfully.");

                if (user.status === "ACTIVE") {
                  navigate("/profile");
                }
              } catch (err: any) {
                setError(err?.message || "Confirmation failed.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label className="text-sm font-medium text-gray-700">Confirmation code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                pattern="\d{6}"
                autoComplete="one-time-code"
                placeholder="123456"
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-lg tracking-[0.35em] outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !isValidCode}
              className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
            >
              {loading ? "Confirming..." : "Confirm email"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-sm text-gray-600">
            Didn&apos;t receive a code? Check your spam folder or ask backend to provide a resend endpoint.
          </div>
        </Card>
      </div>
    </div>
  );
}
