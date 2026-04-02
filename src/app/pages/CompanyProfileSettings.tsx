import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserAvatar from "../components/UserAvatar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";
import { uploadUserAvatar } from "../lib/user-directory";
import { syncCurrentUserFromApi } from "../lib/user-session";

type Industry = {
  id: number;
  name: string;
};

type Country = {
  id: number;
  name: string;
  code: string;
};

type CompanyProfileResponse = {
  id: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  companyName: string;
  industryName: string;
  description: string;
  websiteUrl: string;
  country: Country;
  minBudget: number;
  maxBudget: number;
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

  if (!res.ok) {
    throw new Error(getErrorMessage(res.status, data, "Request failed"));
  }

  return data as T;
}

async function updateCompanyProfile(userId: number, payload: {
  companyName: string;
  industryId: number;
  description: string;
  websiteUrl: string;
  countryId: number;
  minBudget: number;
  maxBudget: number;
}): Promise<CompanyProfileResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/company/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseBodySafe(res);

  if (!res.ok) {
    throw new Error(getErrorMessage(res.status, data, "Failed to save company profile"));
  }

  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid company profile response.");
  }

  return data as CompanyProfileResponse;
}

async function fetchCompanyProfileByUser(userId: number): Promise<CompanyProfileResponse | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/company/user/${userId}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(getErrorMessage(res.status, data, "Failed to load company profile"));
  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid company profile response.");
  }

  return data as CompanyProfileResponse;
}

function normalizeWebsite(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function CompanyProfile() {
  const role = localStorage.getItem("role");
  const isCompany = role === "COMPANY";
  const userId = Number(localStorage.getItem("userId"));

  const [name, setName] = useState(localStorage.getItem("fullName") || "");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [minBudget, setMinBudget] = useState("0");
  const [maxBudget, setMaxBudget] = useState("0");
  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem("avatar"));

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(
    localStorage.getItem("companyProfileCompleted") !== "true",
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

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
        const me = await syncCurrentUserFromApi().catch(() => null);
        if (!active) return;
        if (me?.avatar !== undefined) {
          setAvatar(me.avatar ?? null);
        }

        const [industryList, countryList] = await Promise.all([
          fetchJson<Industry[]>(`${apiBase}/api/v1/industry`),
          fetchJson<Country[]>(`${apiBase}/api/v1/country`),
        ]);

        if (!active) return;
        const normalizedIndustries = Array.isArray(industryList) ? industryList : [];
        const normalizedCountries = Array.isArray(countryList) ? countryList : [];
        setIndustries(normalizedIndustries);
        setCountries(normalizedCountries);

        if (isCompany && Number.isFinite(userId)) {
          const profile = await fetchCompanyProfileByUser(userId);
          if (!active || !profile) return;

          const matchedIndustry = normalizedIndustries.find(
            (item) => item.name === profile.industryName,
          );
          const normalizedProfileCache = {
            id: profile.id,
            userId: profile.userId,
            companyName: profile.companyName,
            description: profile.description,
            websiteUrl: profile.websiteUrl,
            industryId: matchedIndustry?.id ?? 0,
            industryName: profile.industryName,
            countryId: profile.country.id,
            countryName: profile.country.name,
            minBudget: profile.minBudget,
            maxBudget: profile.maxBudget,
          };

          localStorage.setItem("companyProfile", JSON.stringify(normalizedProfileCache));
          localStorage.setItem("companyProfileCompleted", "true");
          localStorage.setItem("profileCompleted", "true");
          localStorage.setItem("fullName", profile.companyName);

          setName(profile.companyName);
          setBio(profile.description || "");
          setWebsite(profile.websiteUrl || "");
          setIndustryId(normalizedProfileCache.industryId ? String(normalizedProfileCache.industryId) : "");
          setCountryId(String(profile.country.id));
          setMinBudget(String(profile.minBudget ?? 0));
          setMaxBudget(String(profile.maxBudget ?? 0));
          setIsEditing(false);
        } else {
          localStorage.removeItem("companyProfile");
          localStorage.removeItem("companyProfileCompleted");
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load industries and countries.");
      } finally {
        if (active) setInitLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [isCompany, userId]);

  const canSave = useMemo(() => {
    return !saving && !initLoading && isCompany && Number.isFinite(userId) && isEditing;
  }, [saving, initLoading, isCompany, userId, isEditing]);

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    const parsedIndustryId = Number(industryId);
    const parsedCountryId = Number(countryId);
    const parsedMin = Number(minBudget);
    const parsedMax = Number(maxBudget);
    const normalizedWebsite = normalizeWebsite(website);

    if (!isCompany) {
      setError("This page is for COMPANY accounts.");
      return;
    }
    if (!Number.isFinite(userId)) {
      setError("User ID is missing. Re-login and try again.");
      return;
    }
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!Number.isFinite(parsedIndustryId) || parsedIndustryId < 0) {
      setError("Please choose an industry.");
      return;
    }
    if (!Number.isFinite(parsedCountryId) || parsedCountryId < 0) {
      setError("Please choose a country.");
      return;
    }
    if (!Number.isFinite(parsedMin) || parsedMin < 0) {
      setError("Minimum budget must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(parsedMax) || parsedMax < 0) {
      setError("Maximum budget must be a non-negative number.");
      return;
    }
    if (parsedMax < parsedMin) {
      setError("Maximum budget cannot be less than minimum budget.");
      return;
    }
    if (normalizedWebsite) {
      try {
        new URL(normalizedWebsite);
      } catch {
        setError("Please enter a valid website URL.");
        return;
      }
    }

    try {
      setSaving(true);

      const response = await updateCompanyProfile(userId, {
        companyName: name.trim(),
        industryId: parsedIndustryId,
        description: bio.trim(),
        websiteUrl: normalizedWebsite,
        countryId: parsedCountryId,
        minBudget: parsedMin,
        maxBudget: parsedMax,
      });

      const selectedIndustry = industries.find((item) => item.name === response.industryName);
      const normalizedProfileCache = {
        id: response.id,
        userId: response.userId,
        companyName: response.companyName,
        description: response.description,
        websiteUrl: response.websiteUrl,
        industryId: selectedIndustry?.id ?? parsedIndustryId,
        industryName: response.industryName,
        countryId: response.country.id,
        countryName: response.country.name,
        minBudget: response.minBudget,
        maxBudget: response.maxBudget,
      };

      localStorage.setItem("companyProfile", JSON.stringify(normalizedProfileCache));
      localStorage.setItem("profileCompleted", "true");
      localStorage.setItem("companyProfileCompleted", "true");
      localStorage.setItem("fullName", response.companyName);

      setIndustryId(String(normalizedProfileCache.industryId));
      setCountryId(String(response.country.id));
      setName(response.companyName);
      setBio(response.description);
      setWebsite(response.websiteUrl);
      setMinBudget(String(response.minBudget));
      setMaxBudget(String(response.maxBudget));
      setSuccess("Company profile saved.");
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save company profile.");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!isCompany) {
      setError("This page is for COMPANY accounts.");
      return;
    }
    if (!Number.isFinite(userId)) {
      setError("User ID is missing. Re-login and try again.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    try {
      setAvatarUploading(true);
      setError(null);
      setSuccess(null);
      const updatedUser = await uploadUserAvatar(userId, file);
      setAvatar(updatedUser.avatar ?? null);
      setSuccess("Avatar updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
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
                <Building2 className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Complete this once after registration, then update it anytime from Profile.
            </p>

            {!isCompany && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>This page is intended for COMPANY users.</div>
              </div>
            )}

            {initLoading && (
              <div className="mb-5 text-sm text-gray-600">Loading industries and countries...</div>
            )}

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
              <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      avatar={avatar}
                      label={name || localStorage.getItem("email") || "Company"}
                      className="h-20 w-20 rounded-2xl"
                      fallbackClassName="rounded-2xl bg-[#1E3A8A] text-xl font-semibold text-white"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Company Avatar</div>
                      <div className="mt-1 text-sm text-gray-600">
                        This image will be used across chats, lists, and profile views.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onAvatarSelected}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#3B82F6] text-[#3B82F6]"
                      disabled={avatarUploading || !isCompany || !Number.isFinite(userId)}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarUploading ? "Uploading..." : avatar ? "Change Avatar" : "Upload Avatar"}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  placeholder="Acme Technologies"
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
                  placeholder="Short info about your company..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Industry</label>
                  <Select value={industryId} onValueChange={setIndustryId} disabled={!isEditing}>
                    <SelectTrigger className="mt-2 h-11 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Choose industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <Select value={countryId} onValueChange={setCountryId} disabled={!isEditing}>
                    <SelectTrigger className="mt-2 h-11 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Choose country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Min Budget</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    disabled={!isEditing}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Max Budget</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    disabled={!isEditing}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                    placeholder="0"
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
