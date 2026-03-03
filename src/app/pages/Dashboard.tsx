import { Link } from "react-router";
import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import KPICard from "../components/KPICard";
import RiskBadge from "../components/RiskBadge";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Megaphone,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Youtube,
  Instagram,
  Twitter,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const audienceData = [
  { name: "18-24", value: 25 },
  { name: "25-34", value: 35 },
  { name: "35-44", value: 20 },
  { name: "45-54", value: 15 },
  { name: "55+", value: 5 },
];

const performanceData = [
  { name: "Jan", predicted: 4.5, actual: 4.2 },
  { name: "Feb", predicted: 5.2, actual: 5.5 },
  { name: "Mar", predicted: 6.1, actual: 5.8 },
  { name: "Apr", predicted: 6.8, actual: 7.2 },
];

const COLORS = ["#3B82F6", "#1E3A8A", "#60A5FA", "#93C5FD", "#DBEAFE"];

const aiMatches = [
  {
    id: 1,
    name: "Sarah Johnson",
    image:
      "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNDY0OTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    platforms: ["youtube", "instagram"],
    categories: ["Technology", "Business"],
    matchScore: 94,
    predictedCTR: "4.8%",
    risk: "LOW" as const,
    followers: "850K",
  },
  {
    id: 2,
    name: "Marcus Chen",
    image:
      "https://images.unsplash.com/photo-1556557286-bf3be5fd9d06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGNvbnRlbnQlMjBjcmVhdG9yJTIwbWFsZXxlbnwxfHx8fDE3NzE0Njc1MTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    platforms: ["youtube", "twitter"],
    categories: ["Tech Reviews", "SaaS"],
    matchScore: 89,
    predictedCTR: "4.5%",
    risk: "LOW" as const,
    followers: "620K",
  },
  {
    id: 3,
    name: "Emma Davis",
    image:
      "https://images.unsplash.com/photo-1602566356438-dd36d35e989c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkaWdpdGFsJTIwY3JlYXRvciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTQ2NzUxNHww&ixlib=rb-4.1.0&q=80&w=1080",
    platforms: ["instagram", "youtube"],
    categories: ["Marketing", "Productivity"],
    matchScore: 87,
    predictedCTR: "4.2%",
    risk: "MEDIUM" as const,
    followers: "440K",
  },
  {
    id: 4,
    name: "Alex Rivera",
    image:
      "https://images.unsplash.com/photo-1531539648265-33e27dc578c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwc3RhcnR1cCUyMGVudHJlcHJlbmV1cnxlbnwxfHx8fDE3NzE0Njc1MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    platforms: ["youtube"],
    categories: ["Entrepreneurship", "B2B"],
    matchScore: 82,
    predictedCTR: "3.9%",
    risk: "LOW" as const,
    followers: "590K",
  },
];

// ✅ For now "All Profiles" uses the same mock array.
// Later you can replace this with a real "allCreators" list from backend.
const allProfiles = aiMatches;

export default function Dashboard() {
  // ✅ Search/filter state for "All Profiles"
  const [query, setQuery] = useState("");

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProfiles;

    return allProfiles.filter((c) => {
      const name = c.name.toLowerCase();
      const cats = c.categories.join(" ").toLowerCase();
      const plats = c.platforms.join(" ").toLowerCase();
      return name.includes(q) || cats.includes(q) || plats.includes(q);
    });
  }, [query]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600">
              Monitor your campaigns and discover AI-matched creators
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Active Campaigns"
              value={12}
              icon={Megaphone}
              trend="3 new this week"
              trendUp={true}
            />
            <KPICard
              title="Total Budget"
              value="$124K"
              icon={DollarSign}
              trend="$18K remaining"
              trendUp={true}
            />
            <KPICard
              title="Predicted ROI"
              value="327%"
              icon={TrendingUp}
              trend="+12% vs last month"
              trendUp={true}
            />
            <KPICard
              title="Risk Index"
              value="Low"
              icon={ShieldAlert}
              trend="All campaigns verified"
              trendUp={true}
            />
          </div>

          {/* AI Recommendations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  AI Recommended Matches
                </h2>
                <p className="text-gray-600">
                  Top creators for your active campaigns
                </p>
              </div>
              <Button
                variant="outline"
                className="border-[#3B82F6] text-[#3B82F6]"
              >
                View All Matches
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiMatches.map((creator) => (
                <Card
                  key={creator.id}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {creator.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {creator.followers} followers
                          </p>
                        </div>
                        <RiskBadge level={creator.risk} />
                      </div>

                      <div className="flex gap-2 mb-3">
                        {creator.platforms.includes("youtube") && (
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <Youtube className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {creator.platforms.includes("instagram") && (
                          <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Instagram className="w-4 h-4 text-pink-600" />
                          </div>
                        )}
                        {creator.platforms.includes("twitter") && (
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Twitter className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mb-4">
                        {creator.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="bg-[#EFF6FF] text-[#3B82F6] text-xs"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Match Score
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#3B82F6] rounded-full"
                                style={{ width: `${creator.matchScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {creator.matchScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Predicted CTR
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {creator.predictedCTR}
                          </p>
                        </div>
                      </div>

                      <Link to={`/match/${creator.id}`}>
                        <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ✅ NEW: All Profiles + Filter */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  All Creator Profiles
                </h2>
                <p className="text-gray-600">
                  Search and browse all creators available on the platform
                </p>
              </div>

              <div className="w-full md:w-[420px]">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, category or platform..."
                    className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProfiles.map((creator) => (
                <Card
                  key={`all-${creator.id}`}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={creator.image}
                      alt={creator.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {creator.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {creator.followers} followers
                          </p>
                        </div>
                        <RiskBadge level={creator.risk} />
                      </div>

                      <div className="flex gap-2 mb-3">
                        {creator.platforms.includes("youtube") && (
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <Youtube className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        {creator.platforms.includes("instagram") && (
                          <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Instagram className="w-4 h-4 text-pink-600" />
                          </div>
                        )}
                        {creator.platforms.includes("twitter") && (
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Twitter className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mb-4 flex-wrap">
                        {creator.categories.map((cat) => (
                          <Badge
                            key={`all-${creator.id}-${cat}`}
                            variant="secondary"
                            className="bg-[#EFF6FF] text-[#3B82F6] text-xs"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Match Score
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#3B82F6] rounded-full"
                                style={{ width: `${creator.matchScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {creator.matchScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">
                            Predicted CTR
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {creator.predictedCTR}
                          </p>
                        </div>
                      </div>

                      <Link to={`/match/${creator.id}`}>
                        <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <div className="mt-6 text-sm text-gray-600">
                No creators found for “{query}”.
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience Demographics */}
            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Target Audience Demographics
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={audienceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {audienceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Performance Prediction */}
            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Performance Prediction vs Actual
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="predicted"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="actual"
                    fill="#1E3A8A"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#3B82F6] rounded-full" />
                  <span className="text-sm text-gray-600">Predicted CTR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1E3A8A] rounded-full" />
                  <span className="text-sm text-gray-600">Actual CTR</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}