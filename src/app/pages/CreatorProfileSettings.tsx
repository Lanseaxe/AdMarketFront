import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle2, User } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";

type Category = {
  id: number;
  name: string;
};

type CreatorProfileResponse = {
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

function getErrorMessage(status: number, data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const maybeObj = data as Record<string, unknown>;
    const directMessage =
      (typeof maybeObj.message === "string" && maybeObj.message) ||
      (typeof maybeObj.detail === "string" && maybeObj.detail) ||
      (typeof maybeObj.error === "string" && maybeObj.error);
    if (directMessage) return directMessage;
  }

  if (status === 400) return "Invalid profile data.";
  if (status === 401) return "Unauthorized. Please sign in again.";
  if (status === 404) return "Required profile resource was not found.";

  return `${fallback} (HTTP ${status}).`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithAuthRetry(url, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (!res.ok) throw new Error(getErrorMessage(res.status, data, "Request failed"));
  return data as T;
}

async function updateCreatorProfile(
  userId: number,
  payload: {
    displayName: string;
    bio: string;
    primaryCategoryId: number;
    followersCount: number;
    avgViews: number;
    engagementRate: number;
    contactEmail: string;
  },
): Promise<CreatorProfileResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/creator/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseBodySafe(res);

  if (!res.ok) {
    throw new Error(getErrorMessage(res.status, data, "Failed to save creator profile"));
  }

  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid creator profile response.");
  }

  return data as CreatorProfileResponse;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CreatorProfileSettings() {
  const role = localStorage.getItem("role");
  const isCreator = role === "CREATOR";
  const userId = Number(localStorage.getItem("userId"));

  const [displayName, setDisplayName] = useState(localStorage.getItem("fullName") || "");
  const [bio, setBio] = useState("");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [followersCount, setFollowersCount] = useState("0");
  const [avgViews, setAvgViews] = useState("0");
  const [engagementRate, setEngagementRate] = useState("1");
  const [contactEmail, setContactEmail] = useState(localStorage.getItem("email") || "");

  const [categories, setCategories] = useState<Category[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(
    localStorage.getItem("creatorProfileCompleted") !== "true",
  );

  useEffect(() => {
    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      setInitLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const categoryList = await fetchJson<Category[]>(`${apiBase}/api/v1/category`);
        if (!active) return;
        setCategories(Array.isArray(categoryList) ? categoryList : []);

        const cached = localStorage.getItem("creatorProfile");
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as Record<string, unknown>;
            if (typeof parsed.displayName === "string") setDisplayName(parsed.displayName);
            if (typeof parsed.bio === "string") setBio(parsed.bio);
            if (typeof parsed.primaryCategoryId === "number") {
              setPrimaryCategoryId(String(parsed.primaryCategoryId));
            }
            if (typeof parsed.followersCount === "number") setFollowersCount(String(parsed.followersCount));
            if (typeof parsed.avgViews === "number") setAvgViews(String(parsed.avgViews));
            if (typeof parsed.engagementRate === "number") setEngagementRate(String(parsed.engagementRate));
            if (typeof parsed.contactEmail === "string") setContactEmail(parsed.contactEmail);
          } catch {
            // ignore broken cache
          }
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load categories.");
      } finally {
        if (active) setInitLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const canSave = useMemo(() => {
    return !saving && !initLoading && isCreator && Number.isFinite(userId) && isEditing;
  }, [saving, initLoading, isCreator, userId, isEditing]);

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    const parsedCategoryId = Number(primaryCategoryId);
    const parsedFollowers = Number(followersCount);
    const parsedViews = Number(avgViews);
    const parsedEngagement = Number(engagementRate);
    const normalizedEmail = contactEmail.trim().toLowerCase();

    if (!isCreator) {
      setError("This page is for CREATOR accounts.");
      return;
    }
    if (!Number.isFinite(userId)) {
      setError("User ID is missing. Re-login and try again.");
      return;
    }
    if (!displayName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!Number.isFinite(parsedCategoryId) || parsedCategoryId < 0) {
      setError("Please choose a category.");
      return;
    }
    if (!Number.isFinite(parsedFollowers) || parsedFollowers < 0) {
      setError("Followers count must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(parsedViews) || parsedViews < 0) {
      setError("Average views must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(parsedEngagement) || parsedEngagement < 1 || parsedEngagement > 100) {
      setError("Engagement rate must be from 1 to 100.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid contact email.");
      return;
    }

    try {
      setSaving(true);

      const response = await updateCreatorProfile(userId, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        primaryCategoryId: parsedCategoryId,
        followersCount: parsedFollowers,
        avgViews: parsedViews,
        engagementRate: parsedEngagement,
        contactEmail: normalizedEmail,
      });

      const selectedCategory = categories.find((item) => item.name === response.primaryCategoryName);
      const profileCache = {
        id: response.id,
        userId: response.userId,
        displayName: response.displayName,
        bio: response.bio,
        primaryCategoryId: selectedCategory?.id ?? parsedCategoryId,
        primaryCategoryName: response.primaryCategoryName,
        followersCount: response.followersCount,
        avgViews: response.avgViews,
        engagementRate: response.engagementRate,
        contactEmail: response.contactEmail,
      };

      localStorage.setItem("creatorProfile", JSON.stringify(profileCache));
      localStorage.setItem("profileCompleted", "true");
      localStorage.setItem("creatorProfileCompleted", "true");
      localStorage.setItem("fullName", response.displayName);
      localStorage.setItem("email", response.contactEmail);

      setPrimaryCategoryId(String(profileCache.primaryCategoryId));
      setDisplayName(response.displayName);
      setBio(response.bio);
      setFollowersCount(String(response.followersCount));
      setAvgViews(String(response.avgViews));
      setEngagementRate(String(response.engagementRate));
      setContactEmail(response.contactEmail);
      setSuccess("Creator profile saved.");
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save creator profile.");
    } finally {
      setSaving(false);
    }
  };

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

          <Card className="p-8 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Complete this once after registration, then update it anytime from Profile.
            </p>

            {!isCreator && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>This page is intended for CREATOR users.</div>
              </div>
            )}

            {initLoading && <div className="mb-5 text-sm text-gray-600">Loading categories...</div>}

            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                <div>{success}</div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  placeholder="John Creator"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  placeholder="Short info about you..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select
                  value={primaryCategoryId}
                  onValueChange={setPrimaryCategoryId}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-2 h-11 border-gray-200 rounded-xl">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Followers Count</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={followersCount}
                    onChange={(e) => setFollowersCount(e.target.value)}
                    disabled={!isEditing}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Average Views</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={avgViews}
                    onChange={(e) => setAvgViews(e.target.value)}
                    disabled={!isEditing}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Engagement Rate (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(e.target.value)}
                    disabled={!isEditing}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    placeholder="1 - 100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={!isEditing}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    placeholder="creator@email.com"
                  />
                </div>
              </div>

              {isEditing ? (
                <Button
                  type="button"
                  disabled={!canSave}
                  onClick={onSave}
                  className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setIsEditing(true);
                  }}
                  className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
