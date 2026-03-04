import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

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

  if (status === 400) return "Please provide a valid email.";
  if (status === 404) return "Account not found for this email.";

  return `Failed to send reset code (HTTP ${status}).`;
}

async function requestForgetPasswordCode(email: string): Promise<void> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetch(`${apiBase}/api/v1/user/forget-password-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (res.ok) return;

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  throw new Error(getErrorMessage(res.status, data));
}

export default function ForgotPasswordRequest() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <Link to="/signin" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
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
          <h1 className="text-3xl font-bold text-gray-900">Forgot password</h1>
          <p className="mt-3 text-gray-600">
            Enter your account email. We will send you a reset code.
          </p>

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

              const normalizedEmail = email.trim().toLowerCase();
              if (!normalizedEmail) {
                setError("Email is required.");
                return;
              }

              try {
                setLoading(true);
                await requestForgetPasswordCode(normalizedEmail);
                setSuccess("Reset code sent. Check your email.");
                localStorage.setItem("resetEmail", normalizedEmail);

                navigate("/forgot-password/reset", {
                  state: { email: normalizedEmail },
                });
              } catch (err: any) {
                setError(err?.message || "Failed to send reset code.");
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="you@company.com"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
            >
              {loading ? "Sending code..." : "Send reset code"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Remember your password?{" "}
            <Link to="/signin" className="text-[#3B82F6] hover:underline">
              Back to sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
