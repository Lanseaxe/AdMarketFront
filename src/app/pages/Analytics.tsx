import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, BarChart3, Brain, Globe2, Layers3, ShieldAlert } from "lucide-react";

import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";
import { syncCurrentUserFromApi } from "../lib/user-session";

type CreatorListItem = {
  id: number;
  userId: number;
  displayName: string;
  primaryCategoryName: string | null;
};

type CreatorAudienceAge = {
  id: number;
  ageBegin: number;
  ageEnd: number;
  percentage: number;
};

type CreatorAudienceGeo = {
  id: number;
  country: { id: number; name: string; code: string } | null;
  percentage: number;
};

type CreatorAnalyticsProfile = {
  id: number;
  userId: number;
  displayName: string;
  primaryCategoryName: string | null;
  audienceAges?: CreatorAudienceAge[];
  audienceGeos?: CreatorAudienceGeo[];
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
};

const CHART_COLORS = ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

function requireApiBase() {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
  return apiBase;
}

function seededValue(seed: number, min: number, max: number) {
  const value = Math.sin(seed * 999) * 10000;
  const fraction = value - Math.floor(value);
  return min + fraction * (max - min);
}

async function fetchCreatorPage(): Promise<CreatorListItem[]> {
  const apiBase = requireApiBase();
  const params = new URLSearchParams({
    page: "0",
    size: "100",
    sort: "displayName,asc",
  });
  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/creator?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (!res.ok) throw new Error(`Failed to load creators (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid creators response.");

  const page = data as PageResponse<CreatorListItem>;
  return Array.isArray(page.content) ? page.content : [];
}

async function fetchCreatorProfileByUserId(userId: number): Promise<CreatorAnalyticsProfile | null> {
  const apiBase = requireApiBase();
  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/creator/user/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load creator analytics (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid creator analytics response.");

  return data as CreatorAnalyticsProfile;
}

export default function Analytics() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<CreatorAnalyticsProfile[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const me = await syncCurrentUserFromApi();
        if (!active) return;

        const nextRole = me?.role || localStorage.getItem("role");
        setRole(nextRole);

        if (nextRole !== "COMPANY") {
          setProfiles([]);
          return;
        }

        const creators = await fetchCreatorPage();
        const details = await Promise.all(
          creators.map((creator) => fetchCreatorProfileByUserId(creator.userId)),
        );
        if (!active) return;

        setProfiles(details.filter((item): item is CreatorAnalyticsProfile => Boolean(item)));
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load analytics.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const geographyData = useMemo(() => {
    const totals = new Map<string, number>();

    profiles.forEach((profile) => {
      profile.audienceGeos?.forEach((geo) => {
        const countryName = geo.country?.name || "Unknown";
        totals.set(countryName, (totals.get(countryName) || 0) + Number(geo.percentage || 0));
      });
    });

    return Array.from(totals.entries())
      .map(([name, value]) => ({
        name,
        value: Number((value / Math.max(profiles.length, 1)).toFixed(1)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [profiles]);

  const ageData = useMemo(() => {
    const totals = new Map<string, number>();

    profiles.forEach((profile) => {
      profile.audienceAges?.forEach((age) => {
        const label = `${age.ageBegin}-${age.ageEnd}`;
        totals.set(label, (totals.get(label) || 0) + Number(age.percentage || 0));
      });
    });

    return Array.from(totals.entries())
      .map(([range, value]) => ({
        range,
        value: Number((value / Math.max(profiles.length, 1)).toFixed(1)),
      }))
      .sort((a, b) => {
        const aStart = Number(a.range.split("-")[0]);
        const bStart = Number(b.range.split("-")[0]);
        return aStart - bStart;
      });
  }, [profiles]);

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();

    profiles.forEach((profile) => {
      const category = profile.primaryCategoryName || "Uncategorized";
      totals.set(category, (totals.get(category) || 0) + 1);
    });

    return Array.from(totals.entries())
      .map(([name, creators]) => ({ name, creators }))
      .sort((a, b) => b.creators - a.creators)
      .slice(0, 8);
  }, [profiles]);

  const matchingScoreData = useMemo(() => {
    return profiles.slice(0, 8).map((profile, index) => {
      const baseSeed = profile.userId || profile.id || index + 1;
      return {
        creator: profile.displayName || `Creator ${index + 1}`,
        overall: Number(seededValue(baseSeed, 0.42, 0.62).toFixed(2)),
        successful: Number(seededValue(baseSeed + 17, 0.71, 0.86).toFixed(2)),
      };
    });
  }, [profiles]);

  const summary = useMemo(() => {
    return {
      creators: profiles.length,
      geoPoints: geographyData.length,
      ageBuckets: ageData.length,
      categories: categoryData.length,
    };
  }, [profiles, geographyData, ageData, categoryData]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="mt-2 text-gray-600">
                Company-facing creator analytics dashboard with live audience data and mock ML scoring.
              </p>
            </div>
            <Badge className="w-fit bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#EFF6FF]">
              Companies Only
            </Badge>
          </div>

          {loading && <Card className="border border-gray-200 p-6">Loading analytics...</Card>}
          {error && <Card className="border border-red-200 bg-red-50 p-6 text-red-700">{error}</Card>}

          {!loading && !error && role !== "COMPANY" && (
            <Card className="border border-amber-200 bg-amber-50 p-8 text-center">
              <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-600" />
              <h2 className="text-xl font-semibold text-gray-900">Analytics are currently available only for companies</h2>
              <p className="mt-2 text-gray-600">
                Creator-facing analytics are not implemented yet.
              </p>
            </Card>
          )}

          {!loading && !error && role === "COMPANY" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card className="border border-gray-200 p-5">
                  <div className="text-sm text-gray-500">Creators Analyzed</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{summary.creators}</div>
                </Card>
                <Card className="border border-gray-200 p-5">
                  <div className="text-sm text-gray-500">Geo Segments</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{summary.geoPoints}</div>
                </Card>
                <Card className="border border-gray-200 p-5">
                  <div className="text-sm text-gray-500">Age Buckets</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{summary.ageBuckets}</div>
                </Card>
                <Card className="border border-gray-200 p-5">
                  <div className="text-sm text-gray-500">Tracked Categories</div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{summary.categories}</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card className="border border-gray-200 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Globe2 className="h-5 w-5 text-[#1E3A8A]" />
                    <div>
                      <h2 className="font-semibold text-gray-900">Blogger Audience Geography</h2>
                      <p className="text-sm text-gray-600">Average audience share by country across creator profiles</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={geographyData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={3}
                        >
                          {geographyData.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="border border-gray-200 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-[#1E3A8A]" />
                    <div>
                      <h2 className="font-semibold text-gray-900">Audience Demographics (Age)</h2>
                      <p className="text-sm text-gray-600">Average age distribution from creator audience settings</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="border border-gray-200 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#1E3A8A]" />
                    <div>
                      <h2 className="font-semibold text-gray-900">Blogger Category Distribution</h2>
                      <p className="text-sm text-gray-600">Creator counts by primary category</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="creators" fill="#1E3A8A" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="border border-gray-200 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-[#1E3A8A]" />
                    <div>
                      <h2 className="font-semibold text-gray-900">Matching Algorithm Dashboard (ML Scoring)</h2>
                      <p className="text-sm text-gray-600">Score visualization seeded per creator</p>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#EFF6FF] p-4">
                      <div className="text-sm text-gray-600">Average score of successful matches</div>
                      <div className="mt-1 text-2xl font-bold text-[#1E3A8A]">0.78</div>
                    </div>
                    <div className="rounded-xl bg-[#F3F4F6] p-4">
                      <div className="text-sm text-gray-600">Overall average</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900">0.52</div>
                    </div>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={matchingScoreData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="creator" tickLine={false} axisLine={false} hide />
                        <YAxis domain={[0, 1]} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: number) => value.toFixed(2)} />
                        <Bar dataKey="overall" fill="#93C5FD" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="successful" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
