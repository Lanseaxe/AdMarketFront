import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function SignUp() {
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

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: connect backend auth
              }}
            >
              <div>
                <label className="text-sm font-medium text-gray-700">Full name</label>
                <div className="mt-2 relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
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
                    placeholder="Create a strong password"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Confirm password</label>
                <div className="mt-2 relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    className="w-full border border-gray-200 rounded-xl px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input type="checkbox" className="mt-1 rounded border-gray-300" required />
                <span>
                  I agree to the{" "}
                  <span className="text-[#3B82F6] hover:underline cursor-pointer">
                    Terms
                  </span>{" "}
                  and{" "}
                  <span className="text-[#3B82F6] hover:underline cursor-pointer">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>

              <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base">
                Create account
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