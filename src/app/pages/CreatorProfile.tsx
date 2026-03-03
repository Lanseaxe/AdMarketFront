import { useParams, Link } from "react-router";
import Sidebar from "../components/Sidebar";
import RiskBadge from "../components/RiskBadge";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Youtube,
  Instagram,
  Twitter,
  MapPin,
  Users,
  TrendingUp,
  Eye,
  Heart,
  ArrowLeft,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const creatorData = {
  name: "Sarah Johnson",
  image: "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNDY0OTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  location: "San Francisco, CA",
  followers: "850K",
  platforms: ["youtube", "instagram", "twitter"],
  categories: ["Technology", "Business", "SaaS", "Productivity"],
  bio: "Tech entrepreneur and content creator helping businesses scale with AI and automation. Former VP at a Fortune 500 company.",
  risk: "LOW" as const,
  aiCompatibilityScore: 94
};

const audienceGeoData = [
  { country: 'United States', value: 45 },
  { country: 'United Kingdom', value: 18 },
  { country: 'Canada', value: 12 },
  { country: 'Germany', value: 10 },
  { country: 'Australia', value: 8 },
  { country: 'Others', value: 7 },
];

const compatibilityData = [
  { subject: 'Topic Match', A: 95 },
  { subject: 'Audience Overlap', A: 88 },
  { subject: 'Engagement Rate', A: 92 },
  { subject: 'Brand Safety', A: 98 },
  { subject: 'Performance History', A: 90 },
  { subject: 'Content Quality', A: 94 },
];

export default function CreatorProfile() {
  const { id } = useParams();

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Profile Header */}
          <Card className="p-8 bg-white border border-gray-200 rounded-xl mb-6">
            <div className="flex items-start gap-6">
              <img
                src={creatorData.image}
                alt={creatorData.name}
                className="w-32 h-32 rounded-2xl object-cover"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{creatorData.name}</h1>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{creatorData.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{creatorData.followers} Total Followers</span>
                      </div>
                    </div>
                  </div>
                  <RiskBadge level={creatorData.risk} className="text-sm" />
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{creatorData.bio}</p>

                {/* Platform Icons */}
                <div className="flex gap-3 mb-4">
                  {creatorData.platforms.includes("youtube") && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                      <Youtube className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-900">420K</span>
                    </div>
                  )}
                  {creatorData.platforms.includes("instagram") && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-lg border border-pink-200">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <span className="text-sm font-medium text-pink-900">320K</span>
                    </div>
                  )}
                  {creatorData.platforms.includes("twitter") && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Twitter className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">110K</span>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {creatorData.categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6]">
                      {cat}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link to={`/match/${id}`} className="flex-1">
                    <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                      <Sparkles className="w-4 h-4 mr-2" />
                      View AI Match Analysis
                    </Button>
                  </Link>
                  <Link to="/conversations">
                    <Button variant="outline" className="border-[#3B82F6] text-[#3B82F6]">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Creator
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-5 h-5 text-[#3B82F6]" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg. Reach</p>
              <p className="text-2xl font-semibold text-gray-900">2.4M</p>
              <p className="text-xs text-green-600 mt-1">+18% vs last month</p>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-[#3B82F6]" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Engagement Rate</p>
              <p className="text-2xl font-semibold text-gray-900">6.8%</p>
              <p className="text-xs text-green-600 mt-1">+2.3% vs last month</p>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-[#3B82F6]" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Audience Growth</p>
              <p className="text-2xl font-semibold text-gray-900">+42K</p>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </Card>

            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <p className="text-sm text-gray-600 mb-1">AI Compatibility</p>
              <p className="text-2xl font-semibold text-gray-900">{creatorData.aiCompatibilityScore}%</p>
              <p className="text-xs text-gray-600 mt-1">Excellent match</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience Demographics */}
            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Audience Geography</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={audienceGeoData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" />
                  <YAxis dataKey="country" type="category" stroke="#6B7280" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* AI Compatibility Radar */}
            <Card className="p-6 bg-white border border-gray-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Compatibility Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={compatibilityData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" stroke="#6B7280" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
                  <Radar name="Score" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Predicted Performance */}
          <Card className="p-8 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl mt-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Predicted Campaign Performance</h3>
                <p className="text-blue-100">Based on historical data and AI analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-sm text-blue-100 mb-1">Predicted CTR</p>
                <p className="text-3xl font-bold">4.8%</p>
                <p className="text-xs text-blue-200 mt-1">Industry avg: 2.1%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-sm text-blue-100 mb-1">Predicted Conversion</p>
                <p className="text-3xl font-bold">2.3%</p>
                <p className="text-xs text-blue-200 mt-1">Industry avg: 1.2%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-sm text-blue-100 mb-1">Estimated ROI</p>
                <p className="text-3xl font-bold">385%</p>
                <p className="text-xs text-blue-200 mt-1">Based on $50K budget</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-sm text-blue-100 mb-1">Confidence Score</p>
                <p className="text-3xl font-bold">92%</p>
                <p className="text-xs text-blue-200 mt-1">High accuracy</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
