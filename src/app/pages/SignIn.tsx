import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
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

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: connect backend auth
              }}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="mt-2 relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
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
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                  Remember me
                </label>

                <button type="button" className="text-sm text-[#3B82F6] hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base">
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Don’t have an account?{" "}
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