import { Link } from "react-router";
import { Button } from "../components/ui/button";

export default function Header() {
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

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-gray-600">
            <Link to="/signin">Sign In</Link>
            </Button>
          <Button asChild className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
          <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
