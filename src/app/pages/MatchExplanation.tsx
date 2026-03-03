import { useParams, Link } from "react-router";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import RiskBadge from "../components/RiskBadge";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  ArrowLeft,
  Target,
  Users,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  X,
  Youtube,
  Instagram,
  Twitter,
} from "lucide-react";

const matchData = {
  creator: {
    name: "Sarah Johnson",
    image:
      "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNDY0OTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    followers: "860K",

    // ✅ socials (icons + hover followers)
    platforms: ["youtube", "instagram"],
    platformFollowers: {
      youtube: "850K",
      instagram: "430K",
    } as Record<string, string>,

    // ✅ categories like on dashboard (chips under socials)
    categories: ["Technology", "Business"],
  },
  campaign: "Enterprise SaaS Launch Q1 2026",
  matchScore: 94,
  risk: "LOW" as const,
  breakdown: {
    topicSimilarity: 96,
    audienceOverlap: 89,
    historicalPerformance: 92,
    brandSafety: 98,
  },
  predictions: {
    ctr: "4.8%",
    conversion: "2.3%",
    roi: "385%",
    reach: "2.4M",
    engagement: "165K",
  },
  riskAnalysis: {
    factors: [
      { label: "Content Quality", status: "excellent", score: 98 },
      { label: "Audience Authenticity", status: "excellent", score: 96 },
      { label: "Brand Safety", status: "excellent", score: 98 },
      { label: "Engagement Rate", status: "good", score: 88 },
      { label: "Past Campaign Success", status: "excellent", score: 94 },
    ],
    explanation:
      "This creator has an excellent track record with high engagement rates, authentic audience, and strong brand safety scores. Historical data shows consistent performance above industry benchmarks. Content quality and professionalism are exceptional. Minimal risk factors identified.",
  },
  insights: [
    {
      icon: Target,
      title: "Perfect Topic Alignment",
      description:
        "Creator's content focuses heavily on SaaS, B2B technology, and business automation—directly matching your campaign themes.",
      impact: "positive",
    },
    {
      icon: Users,
      title: "Excellent Audience Match",
      description:
        "89% of the creator's audience matches your target demographics: 25-44 years old, business professionals, decision-makers.",
      impact: "positive",
    },
    {
      icon: TrendingUp,
      title: "Strong Performance History",
      description:
        "Past campaigns with similar products achieved 4.2-5.1% CTR, significantly above the 2.1% industry average.",
      impact: "positive",
    },
    {
      icon: AlertTriangle,
      title: "Premium Pricing",
      description:
        "This creator's rates are in the top 15% of the platform. However, ROI predictions justify the investment.",
      impact: "neutral",
    },
  ],
};

export default function MatchExplanation() {
  const { id } = useParams();

  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  const platformIcons: Record<string, any> = {
    youtube: Youtube,
    instagram: Instagram,
    twitter: Twitter,
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Match Score Hero */}
          <Card className="p-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl mb-6 text-white">
            <div className="flex items-center gap-6">
              <img
                src={matchData.creator.image}
                alt={matchData.creator.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-sm text-blue-100 uppercase tracking-wide">
                    AI Match Analysis
                  </span>
                </div>

                <h1 className="text-3xl font-bold mb-2">
                  {matchData.creator.name}
                </h1>

                <p className="text-blue-100">Campaign: {matchData.campaign}</p>

                {/* ✅ socials row (icons + hover followers) */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {matchData.creator.platforms?.map((platform) => {
                      const Icon = platformIcons[platform];
                      if (!Icon) return null;

                      return (
                        <div
                          key={platform}
                          onMouseEnter={() => setHoveredPlatform(platform)}
                          onMouseLeave={() => setHoveredPlatform(null)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/25 transition cursor-pointer"
                          title={platform}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      );
                    })}
                  </div>

                  {/* ✅ followers text appears to the right */}
                  <div className="text-white/90 text-sm min-w-[140px]">
                    {hoveredPlatform
                      ? `${matchData.creator.platformFollowers?.[hoveredPlatform] ?? ""} followers`
                      : ""}
                  </div>
                </div>

                {/* ✅ categories (chips) UNDER the icons, like in dashboard */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {matchData.creator.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white border border-white/20"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <div className="text-6xl font-bold mb-2">
                  {matchData.matchScore}%
                </div>
                <div className="text-sm text-blue-100">Match Score</div>
                <RiskBadge
                  level={matchData.risk}
                  className="mt-3 bg-white/20 border-white/30"
                />
              </div>
            </div>
          </Card>

          {/* Match Breakdown */}
          <Card className="p-8 bg-white border border-gray-200 rounded-xl mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-[#3B82F6]" />
              Match Score Breakdown
            </h2>

            <div className="space-y-6">
              {/* Topic Similarity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                    <span className="font-medium text-gray-900">
                      Topic Similarity
                    </span>
                  </div>
                  <span className="text-2xl font-semibold text-gray-900">
                    {matchData.breakdown.topicSimilarity}%
                  </span>
                </div>
                <Progress
                  value={matchData.breakdown.topicSimilarity}
                  className="h-3"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Creator's content themes align excellently with your campaign
                  focus areas
                </p>
              </div>

              {/* Audience Overlap */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                    <span className="font-medium text-gray-900">
                      Audience Overlap
                    </span>
                  </div>
                  <span className="text-2xl font-semibold text-gray-900">
                    {matchData.breakdown.audienceOverlap}%
                  </span>
                </div>
                <Progress
                  value={matchData.breakdown.audienceOverlap}
                  className="h-3"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Strong demographic and psychographic match with your target
                  audience
                </p>
              </div>

              {/* Brand Safety */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full" />
                    <span className="font-medium text-gray-900">
                      Brand Safety
                    </span>
                  </div>
                  <span className="text-2xl font-semibold text-gray-900">
                    {matchData.breakdown.brandSafety}%
                  </span>
                </div>
                <Progress
                  value={matchData.breakdown.brandSafety}
                  className="h-3"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Exceptional content quality with no brand safety concerns
                  identified
                </p>
              </div>
            </div>
          </Card>

          {/* Predicted Performance */}
          <Card className="p-8 bg-white border border-gray-200 rounded-xl mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              Predicted Campaign Performance
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Click-Through Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {matchData.predictions.ctr}
                </p>
                <p className="text-xs text-green-600 mt-1">+129% vs avg</p>
              </div>
              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {matchData.predictions.conversion}
                </p>
                <p className="text-xs text-green-600 mt-1">+92% vs avg</p>
              </div>
              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Predicted ROI</p>
                <p className="text-3xl font-bold text-gray-900">
                  {matchData.predictions.roi}
                </p>
                <p className="text-xs text-green-600 mt-1">Excellent</p>
              </div>
              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Est. Reach</p>
                <p className="text-3xl font-bold text-gray-900">
                  {matchData.predictions.reach}
                </p>
                <p className="text-xs text-gray-600 mt-1">Impressions</p>
              </div>
              <div className="p-4 bg-[#F9FAFB] rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Est. Engagement</p>
                <p className="text-3xl font-bold text-gray-900">
                  {matchData.predictions.engagement}
                </p>
                <p className="text-xs text-gray-600 mt-1">Interactions</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    AI Confidence Level: 92%
                  </p>
                  <p className="text-sm text-gray-700">
                    Predictions based on analysis of 847 similar campaigns and 14
                    months of creator performance data. High confidence due to
                    consistent historical patterns and strong data availability.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Risk Analysis */}
          <Card className="p-8 bg-white border border-gray-200 rounded-xl mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#3B82F6]" />
              Risk Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {matchData.riskAnalysis.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {factor.status === "excellent" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    )}
                    <span className="font-medium text-gray-900">
                      {factor.label}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {factor.score}%
                  </span>
                </div>
              ))}
            </div>

            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    LOW RISK PARTNERSHIP
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {matchData.riskAnalysis.explanation}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Insights */}
          <Card className="p-8 bg-white border border-gray-200 rounded-xl mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Key Insights
            </h2>

            <div className="space-y-4">
              {matchData.insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={index}
                    className={`p-5 rounded-lg border ${
                      insight.impact === "positive"
                        ? "bg-green-50 border-green-200"
                        : insight.impact === "neutral"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          insight.impact === "positive"
                            ? "bg-green-100"
                            : insight.impact === "neutral"
                            ? "bg-orange-100"
                            : "bg-red-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            insight.impact === "positive"
                              ? "text-green-600"
                              : insight.impact === "neutral"
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-gray-700">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Decision Actions */}
          <Card className="p-8 bg-white border border-gray-200 rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Make Your Decision
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
                <ThumbsUp className="w-5 h-5 mr-2" />
                Accept Match
              </Button>
              <Link to="/conversations" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-[#3B82F6] text-[#3B82F6] py-6 text-lg"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message Creator
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 py-6 text-lg"
              >
                <X className="w-5 h-5 mr-2" />
                Reject
              </Button>
            </div>

            <p className="text-sm text-gray-600 text-center mt-6">
              Need more information?{" "}
              <Link
                to={`/creator/${id}`}
                className="text-[#3B82F6] hover:underline"
              >
                View full creator profile
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}