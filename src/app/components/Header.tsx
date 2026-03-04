import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { CircleUserRound, LogOut, User } from "lucide-react";
import {
  clearAuthSession,
  getAccessToken,
  setPendingProfileRedirect,
} from "../lib/auth-storage";

export default function Header() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(getAccessToken()));
    const onStorage = () => syncAuth();
    const onWindowFocus = () => syncAuth();
    const onWindowClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("click", onWindowClick);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("click", onWindowClick);
    };
  }, []);

  const onLogout = () => {
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const companyDone = localStorage.getItem("companyProfileCompleted") === "true";
    const creatorDone = localStorage.getItem("creatorProfileCompleted") === "true";
    const shouldKeepOnboardingState =
      (role === "COMPANY" && !companyDone) || (role === "CREATOR" && !creatorDone);

    if (shouldKeepOnboardingState && email && role) {
      setPendingProfileRedirect(email, role);
    }

    clearAuthSession();
    setIsAuthenticated(false);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-2xl font-bold text-[#1E3A8A]">AdMarket</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">Home</Link>
          <Link to="/dashboard" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">Dashboard</Link>
          <a href="#features" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">Features</a>
          <a href="#pricing" className="text-gray-600 hover:text-[#1E3A8A] transition-colors">Pricing</a>
        </nav>

        {!isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-gray-600">
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-[#1E3A8A] hover:bg-[#EFF6FF] transition-colors"
              aria-label="Open profile menu"
            >
              <CircleUserRound className="w-6 h-6" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
