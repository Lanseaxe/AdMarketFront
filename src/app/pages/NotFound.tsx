import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center px-6">
        <div className="mb-8">
          <div className="w-24 h-24 bg-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-5xl font-bold">A</span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/">
          <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
