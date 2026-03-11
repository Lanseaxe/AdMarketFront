import { useEffect, useState } from "react";
import { Link } from "react-router";
import Dashboard from "./Dashboard";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";

async function fetchPaymentMessage(path: string): Promise<string> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (!res.ok) throw new Error(`Failed to verify payment result (HTTP ${res.status})`);
  return typeof data === "string" && data.trim() ? data.trim() : "Payment failed.";
}

export default function PaymentFailed() {
  const [message, setMessage] = useState("Payment failed.");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await fetchPaymentMessage("/api/v1/payment/test-failed");
        if (!active) return;
        setMessage(result);
      } catch {
        if (!active) return;
        setMessage("Payment failed.");
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none blur-sm">
        <Dashboard />
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-6">
        <Card className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-gray-900">Payment failed</h1>
          <p className="mt-3 text-sm text-gray-600">{message}</p>

          <div className="mt-6 flex gap-3">
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
