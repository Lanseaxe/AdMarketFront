import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Mail, Users, Eye, BarChart3, Globe2, Layers3, MonitorPlay } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";

type CreatorDetails = {
  id: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  displayName: string;
  bio: string;
  primaryCategoryName: string;
  followersCount: number;
  avgViews: number;
  engagementRate: number;
  contactEmail: string;
};

type CreatorPlatform = {
  id: number;
  createdAt: string;
  updatedAt: string;
  creator: string;
  platform: string;
  profileUrl: string;
  followersCount: number;
  avgViews: number;
};

type CreatorAudienceAge = {
  id: number;
  createdAt: string;
  updatedAt: string;
  creator: string;
  ageBegin: number;
  ageEnd: number;
  percentage: number;
};

type CreatorAudienceGeo = {
  id: number;
  createdAt: string;
  updatedAt: string;
  creator: string;
  country: { id: number; name: string; code: string };
  percentage: number;
};

type CreatorFullProfile = CreatorDetails & {
  platforms?: CreatorPlatform[];
  audienceAges?: CreatorAudienceAge[];
  audienceGeos?: CreatorAudienceGeo[];
};

async function fetchCreatorById(id: string): Promise<CreatorDetails> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/creator/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Failed to load creator profile (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid creator response.");

  return data as CreatorDetails;
}

async function fetchCreatorByUserId(userId: number): Promise<CreatorFullProfile> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/creator/user/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Failed to load creator details (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid creator details response.");

  return data as CreatorFullProfile;
}

export default function CreatorProfile() {
  const { id } = useParams();
  const [creator, setCreator] = useState<CreatorFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) {
        setError("Creator id is missing.");
        setLoading(false);
        return;
      }
      try {
        const basicProfile = await fetchCreatorById(id);
        const result = await fetchCreatorByUserId(basicProfile.userId);
        if (!active) return;
        setCreator(result);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load creator.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {loading && <Card className="p-6 border border-gray-200">Loading creator profile...</Card>}
          {error && <Card className="p-6 border border-red-200 bg-red-50 text-red-700">{error}</Card>}

          {!loading && !error && creator && (
            <Card className="p-8 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{creator.displayName}</h1>
                  <p className="text-gray-600 mt-1">Creator Profile</p>
                </div>
                <Badge variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6]">
                  {creator.primaryCategoryName || "N/A"}
                </Badge>
              </div>

              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {creator.bio || "No bio provided."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4 bg-[#F9FAFB]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    Followers
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{creator.followersCount}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-[#F9FAFB]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Eye className="w-4 h-4" />
                    Average Views
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{creator.avgViews}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-[#F9FAFB]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <BarChart3 className="w-4 h-4" />
                    Engagement Rate
                  </div>
                  <div className="text-xl font-semibold text-gray-900">{creator.engagementRate}%</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Mail className="w-4 h-4" />
                  Contact Email
                </div>
                <div className="text-gray-900">{creator.contactEmail || "N/A"}</div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-5 border border-gray-200 rounded-xl bg-[#FBFCFE]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <MonitorPlay className="w-4 h-4" />
                    Platform Breakdown
                  </div>
                  <div className="space-y-3">
                    {creator.platforms && creator.platforms.length > 0 ? (
                      creator.platforms.map((platform) => (
                        <div key={platform.id} className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-gray-900">{platform.platform}</div>
                            <div className="text-xs text-gray-500">{platform.followersCount} followers</div>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">Avg views: {platform.avgViews}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No platform data provided.</div>
                    )}
                  </div>
                </Card>

                <Card className="p-5 border border-gray-200 rounded-xl bg-[#FBFCFE]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Layers3 className="w-4 h-4" />
                    Audience Age
                  </div>
                  <div className="space-y-3">
                    {creator.audienceAges && creator.audienceAges.length > 0 ? (
                      creator.audienceAges.map((age) => (
                        <div key={age.id} className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-gray-900">
                              {age.ageBegin}-{age.ageEnd}
                            </div>
                            <div className="text-sm text-[#1E3A8A] font-medium">{age.percentage}%</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No audience age data provided.</div>
                    )}
                  </div>
                </Card>

                <Card className="p-5 border border-gray-200 rounded-xl bg-[#FBFCFE]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <Globe2 className="w-4 h-4" />
                    Audience Country
                  </div>
                  <div className="space-y-3">
                    {creator.audienceGeos && creator.audienceGeos.length > 0 ? (
                      creator.audienceGeos.map((geo) => (
                        <div key={geo.id} className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-gray-900">{geo.country?.name || "Unknown"}</div>
                            <div className="text-sm text-[#1E3A8A] font-medium">{geo.percentage}%</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No audience country data provided.</div>
                    )}
                  </div>
                </Card>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
