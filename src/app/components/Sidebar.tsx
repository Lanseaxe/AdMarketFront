import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Megaphone, 
  Sparkles, 
  MessageSquare, 
  BarChart3, 
  User 
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const isCreator = role === "CREATOR";

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
    { icon: Megaphone, label: "My Campaigns", path: "/campaigns" },
    { icon: MessageSquare, label: "Conversations", path: "/conversations" },
    ...(isCreator ? [] : [{ icon: BarChart3, label: "Analytics", path: "/analytics" }]),
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold text-[#1E3A8A]">AdMarket</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#1E3A8A]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
