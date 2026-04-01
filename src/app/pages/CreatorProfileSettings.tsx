import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserAvatar from "../components/UserAvatar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, AlertCircle, CheckCircle2, Plus, Trash2, User } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";
import { uploadUserAvatar } from "../lib/user-directory";

type Category = {
  id: number;
  name: string;
};

type Country = {
  id: number;
  name: string;
  code: string;
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
  country: Country;
  percentage: number;
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

type CreatorProfileByUserResponse = CreatorProfileResponse & {
  platforms?: CreatorPlatform[];
  audienceAges?: CreatorAudienceAge[];
  audienceGeos?: CreatorAudienceGeo[];
};

type PlatformForm = {
  platform: string;
  profileUrl: string;
  followersCount: string;
  avgViews: string;
};

type AudienceAgeForm = {
  ageBegin: string;
  ageEnd: string;
  percentage: string;
};

type AudienceGeoForm = {
  countryId: string;
  percentage: string;
};

const PLATFORM_OPTIONS = [
  "YOUTUBE",
  "INSTAGRAM",
  "TIKTOK",
  "TELEGRAM",
  "TWITCH",
  "OTHER",
] as const;

const EMPTY_PLATFORM_FORM: PlatformForm = {
  platform: "YOUTUBE",
  profileUrl: "",
  followersCount: "0",
  avgViews: "0",
};

const EMPTY_AGE_FORM: AudienceAgeForm = {
  ageBegin: "",
  ageEnd: "",
  percentage: "0",
};

const EMPTY_GEO_FORM: AudienceGeoForm = {
  countryId: "",
  percentage: "0",
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

async function mutateJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetchWithAuthRetry(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

async function fetchCreatorProfileByUser(userId: number): Promise<CreatorProfileByUserResponse | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/creator/user/${userId}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(getErrorMessage(res.status, data, "Failed to load creator profile"));
  if (!data || typeof data !== "object") {
    throw new Error("Backend returned an invalid creator profile response.");
  }

  return data as CreatorProfileByUserResponse;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidPercentage(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

export default function CreatorProfileSettings() {
  const role = localStorage.getItem("role");
  const isCreator = role === "CREATOR";
  const userId = Number(localStorage.getItem("userId"));

  const [activeTab, setActiveTab] = useState("main");
  const [displayName, setDisplayName] = useState(localStorage.getItem("fullName") || "");
  const [bio, setBio] = useState("");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [followersCount, setFollowersCount] = useState("0");
  const [avgViews, setAvgViews] = useState("0");
  const [engagementRate, setEngagementRate] = useState("1");
  const [contactEmail, setContactEmail] = useState(localStorage.getItem("email") || "");
  const [avatar, setAvatar] = useState<string | null>(localStorage.getItem("avatar"));

  const [platforms, setPlatforms] = useState<CreatorPlatform[]>([]);
  const [audienceAges, setAudienceAges] = useState<CreatorAudienceAge[]>([]);
  const [audienceGeos, setAudienceGeos] = useState<CreatorAudienceGeo[]>([]);
  const [newPlatform, setNewPlatform] = useState<PlatformForm>(EMPTY_PLATFORM_FORM);
  const [newAge, setNewAge] = useState<AudienceAgeForm>(EMPTY_AGE_FORM);
  const [newGeo, setNewGeo] = useState<AudienceGeoForm>(EMPTY_GEO_FORM);

  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(
    localStorage.getItem("creatorProfileCompleted") !== "true",
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const syncProfileState = (profile: CreatorProfileByUserResponse | null, categoryList: Category[]) => {
    if (!profile) {
      setPlatforms([]);
      setAudienceAges([]);
      setAudienceGeos([]);
      return;
    }

    const matchedCategory = categoryList.find((item) => item.name === profile.primaryCategoryName);
    const profileCache = {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      primaryCategoryId: matchedCategory?.id ?? 0,
      primaryCategoryName: profile.primaryCategoryName,
      followersCount: profile.followersCount,
      avgViews: profile.avgViews,
      engagementRate: profile.engagementRate,
      contactEmail: profile.contactEmail,
      platforms: profile.platforms || [],
      audienceAges: profile.audienceAges || [],
      audienceGeos: profile.audienceGeos || [],
    };

    localStorage.setItem("creatorProfile", JSON.stringify(profileCache));
    localStorage.setItem("creatorProfileCompleted", "true");
    localStorage.setItem("profileCompleted", "true");
    localStorage.setItem("fullName", profile.displayName);
    localStorage.setItem("email", profile.contactEmail);

    setDisplayName(profile.displayName);
    setBio(profile.bio || "");
    setPrimaryCategoryId(profileCache.primaryCategoryId ? String(profileCache.primaryCategoryId) : "");
    setFollowersCount(String(profile.followersCount ?? 0));
    setAvgViews(String(profile.avgViews ?? 0));
    setEngagementRate(String(profile.engagementRate ?? 1));
    setContactEmail(profile.contactEmail || localStorage.getItem("email") || "");
    setPlatforms(Array.isArray(profile.platforms) ? profile.platforms : []);
    setAudienceAges(Array.isArray(profile.audienceAges) ? profile.audienceAges : []);
    setAudienceGeos(Array.isArray(profile.audienceGeos) ? profile.audienceGeos : []);
  };

  const refreshCreatorProfile = async (categoryList: Category[] = categories) => {
    if (!isCreator || !Number.isFinite(userId)) return;
    const profile = await fetchCreatorProfileByUser(userId);

    if (!profile) {
      localStorage.removeItem("creatorProfile");
      localStorage.removeItem("creatorProfileCompleted");
      setPlatforms([]);
      setAudienceAges([]);
      setAudienceGeos([]);
      return;
    }

    syncProfileState(profile, categoryList);
  };

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
        const [categoryList, countryList] = await Promise.all([
          fetchJson<Category[]>(`${apiBase}/api/v1/category`),
          fetchJson<Country[]>(`${apiBase}/api/v1/country`),
        ]);

        if (!active) return;
        const normalizedCategories = Array.isArray(categoryList) ? categoryList : [];
        const normalizedCountries = Array.isArray(countryList) ? countryList : [];
        setCategories(normalizedCategories);
        setCountries(normalizedCountries);

        if (isCreator && Number.isFinite(userId)) {
          const profile = await fetchCreatorProfileByUser(userId);
          if (!active) return;

          if (profile) {
            syncProfileState(profile, normalizedCategories);
            setIsEditing(false);
          } else {
            localStorage.removeItem("creatorProfile");
            localStorage.removeItem("creatorProfileCompleted");
            setPlatforms([]);
            setAudienceAges([]);
            setAudienceGeos([]);
          }
        } else {
          localStorage.removeItem("creatorProfile");
          localStorage.removeItem("creatorProfileCompleted");
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load creator profile.");
      } finally {
        if (active) setInitLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [isCreator, userId]);

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

  const onAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!isCreator) {
      setError("This page is for CREATOR accounts.");
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

  const onAddPlatform = async () => {
    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    const parsedFollowers = Number(newPlatform.followersCount);
    const parsedViews = Number(newPlatform.avgViews);
    const normalizedUrl = normalizeUrl(newPlatform.profileUrl);

    if (!newPlatform.platform) {
      setError("Choose a platform.");
      return;
    }
    if (!normalizedUrl) {
      setError("Platform profile URL is required.");
      return;
    }
    if (!Number.isFinite(parsedFollowers) || parsedFollowers < 0) {
      setError("Platform followers count must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(parsedViews) || parsedViews < 0) {
      setError("Platform average views must be a non-negative number.");
      return;
    }

    try {
      setSectionLoading("platform-add");
      try {
        await mutateJson<CreatorPlatform>(`${apiBase}/api/v1/creator/platform`, "POST", {
          platform: newPlatform.platform,
          profileUrl: normalizedUrl,
          followersCount: parsedFollowers,
          avgViews: parsedViews,
        });
      } catch {
        await mutateJson<CreatorPlatform>(`${apiBase}/api/v1/creator/platform`, "POST", {
          platform: newPlatform.platform,
          profileUrl: normalizedUrl,
          followersCount: parsedFollowers,
          avgViews: parsedViews,
        });
      }
      await refreshCreatorProfile();
      setNewPlatform(EMPTY_PLATFORM_FORM);
      setSuccess("Platform added.");
    } catch (err: any) {
      setError(err?.message || "Failed to add platform.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onUpdatePlatform = async (platform: CreatorPlatform) => {
    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    if (!platform.platform) {
      setError("Choose a platform.");
      return;
    }
    if (!platform.profileUrl.trim()) {
      setError("Platform profile URL is required.");
      return;
    }
    if (!Number.isFinite(platform.followersCount) || platform.followersCount < 0) {
      setError("Platform followers count must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(platform.avgViews) || platform.avgViews < 0) {
      setError("Platform average views must be a non-negative number.");
      return;
    }

    try {
      setSectionLoading(`platform-save-${platform.id}`);
      await mutateJson<CreatorPlatform>(`${apiBase}/api/v1/creator/platform/${platform.id}`, "PUT", {
        platform: platform.platform,
        profileUrl: normalizeUrl(platform.profileUrl),
        followersCount: platform.followersCount,
        avgViews: platform.avgViews,
      });
      await refreshCreatorProfile();
      setSuccess("Platform updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update platform.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onDeletePlatform = async (platformId: number) => {
    const confirmed = window.confirm("Delete this platform?");
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    try {
      setSectionLoading(`platform-delete-${platformId}`);
      await mutateJson<CreatorPlatform>(`${apiBase}/api/v1/creator/platform/${platformId}`, "DELETE");
      await refreshCreatorProfile();
      setSuccess("Platform deleted.");
    } catch (err: any) {
      setError(err?.message || "Failed to delete platform.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onAddAudienceAge = async () => {
    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    const ageBegin = Number(newAge.ageBegin);
    const ageEnd = Number(newAge.ageEnd);
    const percentage = Number(newAge.percentage);

    if (!Number.isFinite(ageBegin) || ageBegin < 0) {
      setError("Age begin must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(ageEnd) || ageEnd < ageBegin) {
      setError("Age end must be greater than or equal to age begin.");
      return;
    }
    if (!isValidPercentage(percentage)) {
      setError("Age percentage must be from 0 to 100.");
      return;
    }

    try {
      setSectionLoading("age-add");
      await mutateJson<CreatorAudienceAge>(`${apiBase}/api/v1/creator/audience/age`, "POST", {
        ageBegin,
        ageEnd,
        percentage,
      });
      await refreshCreatorProfile();
      setNewAge(EMPTY_AGE_FORM);
      setSuccess("Audience age added.");
    } catch (err: any) {
      setError(err?.message || "Failed to add audience age.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onUpdateAudienceAge = async (audienceAge: CreatorAudienceAge) => {
    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    if (!Number.isFinite(audienceAge.ageBegin) || audienceAge.ageBegin < 0) {
      setError("Age begin must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(audienceAge.ageEnd) || audienceAge.ageEnd < audienceAge.ageBegin) {
      setError("Age end must be greater than or equal to age begin.");
      return;
    }
    if (!isValidPercentage(audienceAge.percentage)) {
      setError("Age percentage must be from 0 to 100.");
      return;
    }

    try {
      setSectionLoading(`age-save-${audienceAge.id}`);
      await mutateJson<CreatorAudienceAge>(
        `${apiBase}/api/v1/creator/audience/age/${audienceAge.id}`,
        "PUT",
        {
          ageBegin: audienceAge.ageBegin,
          ageEnd: audienceAge.ageEnd,
          percentage: audienceAge.percentage,
        },
      );
      await refreshCreatorProfile();
      setSuccess("Audience age updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update audience age.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onDeleteAudienceAge = async (ageId: number) => {
    const confirmed = window.confirm("Delete this audience age row?");
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    try {
      setSectionLoading(`age-delete-${ageId}`);
      await mutateJson<CreatorAudienceAge>(`${apiBase}/api/v1/creator/audience/age/${ageId}`, "DELETE");
      await refreshCreatorProfile();
      setSuccess("Audience age deleted.");
    } catch (err: any) {
      setError(err?.message || "Failed to delete audience age.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onAddAudienceGeo = async () => {
    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    const countryId = Number(newGeo.countryId);
    const percentage = Number(newGeo.percentage);

    if (!Number.isFinite(countryId) || countryId <= 0) {
      setError("Choose a country.");
      return;
    }
    if (!isValidPercentage(percentage)) {
      setError("Country percentage must be from 0 to 100.");
      return;
    }

    try {
      setSectionLoading("geo-add");
      await mutateJson<CreatorAudienceGeo>(`${apiBase}/api/v1/creator/audience/geo`, "POST", {
        countryId,
        percentage,
      });
      await refreshCreatorProfile();
      setNewGeo(EMPTY_GEO_FORM);
      setSuccess("Audience country added.");
    } catch (err: any) {
      setError(err?.message || "Failed to add audience country.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onUpdateAudienceGeo = async (audienceGeo: CreatorAudienceGeo) => {
    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    if (!isValidPercentage(audienceGeo.percentage)) {
      setError("Country percentage must be from 0 to 100.");
      return;
    }

    try {
      setSectionLoading(`geo-save-${audienceGeo.id}`);
      await mutateJson<CreatorAudienceGeo>(
        `${apiBase}/api/v1/creator/audience/geo/${audienceGeo.id}`,
        "PUT",
        {
          percentage: audienceGeo.percentage,
        },
      );
      await refreshCreatorProfile();
      setSuccess("Audience country updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to update audience country.");
    } finally {
      setSectionLoading(null);
    }
  };

  const onDeleteAudienceGeo = async (geoId: number) => {
    const confirmed = window.confirm("Delete this audience country row?");
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
      setError("VITE_API_URL is not set. Add it to your .env file.");
      return;
    }

    try {
      setSectionLoading(`geo-delete-${geoId}`);
      await mutateJson<CreatorAudienceGeo>(`${apiBase}/api/v1/creator/audience/geo/${geoId}`, "DELETE");
      await refreshCreatorProfile();
      setSuccess("Audience country deleted.");
    } catch (err: any) {
      setError(err?.message || "Failed to delete audience country.");
    } finally {
      setSectionLoading(null);
    }
  };

  const finishTabEditing = (message: string) => {
    setError(null);
    setSuccess(message);
    setIsEditing(false);
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

          <Card className="p-8 bg-white border border-gray-200 rounded-xl mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
            </div>
            <p className="text-gray-600">
              Complete this once after registration, then update it anytime from Profile.
            </p>
          </Card>

          <Card className="p-8 bg-white border border-gray-200 rounded-xl">
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

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 h-auto w-full justify-start rounded-xl bg-[#F3F6FB] p-1">
                <TabsTrigger value="main" className="rounded-lg px-4 py-2.5">
                  Main Info
                </TabsTrigger>
                <TabsTrigger value="platforms" className="rounded-lg px-4 py-2.5">
                  Platforms
                </TabsTrigger>
                <TabsTrigger value="audience-age" className="rounded-lg px-4 py-2.5">
                  Audience Age
                </TabsTrigger>
                <TabsTrigger value="audience-country" className="rounded-lg px-4 py-2.5">
                  Audience Country
                </TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="mt-0">
                <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      avatar={avatar}
                      label={displayName || contactEmail || "Creator"}
                      className="h-20 w-20 rounded-2xl"
                      fallbackClassName="rounded-2xl bg-[#1E3A8A] text-xl font-semibold text-white"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Creator Avatar</div>
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
                      disabled={avatarUploading || !isCreator || !Number.isFinite(userId)}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarUploading ? "Uploading..." : avatar ? "Change Avatar" : "Upload Avatar"}
                    </Button>
                  </div>
                </div>
              </div>

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

              <div className="mt-6">
                {isEditing ? (
                  <Button
                    type="button"
                    disabled={!canSave}
                    onClick={onSave}
                    className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
                  >
                    {saving ? "Saving..." : "Save Main Info"}
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
                    Edit Main Info
                  </Button>
                )}
              </div>

                </div>
              </TabsContent>

              <TabsContent value="platforms" className="mt-0">
                <div className="space-y-4">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="rounded-xl border border-gray-200 p-4 bg-[#FBFCFE]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Platform</label>
                          <Select
                            value={platform.platform}
                            onValueChange={(value) =>
                              setPlatforms((prev) =>
                                prev.map((item) => (item.id === platform.id ? { ...item, platform: value } : item)),
                              )
                            }
                            disabled={!isEditing}
                          >
                            <SelectTrigger className="mt-2 h-11 border-gray-200 rounded-xl">
                              <SelectValue placeholder="Choose platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {PLATFORM_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Profile URL</label>
                          <input
                            value={platform.profileUrl}
                            onChange={(e) =>
                              setPlatforms((prev) =>
                                prev.map((item) =>
                                  item.id === platform.id ? { ...item, profileUrl: e.target.value } : item,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                            placeholder="https://platform.com/creator"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Followers Count</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={platform.followersCount}
                            onChange={(e) =>
                              setPlatforms((prev) =>
                                prev.map((item) =>
                                  item.id === platform.id
                                    ? { ...item, followersCount: Number(e.target.value) }
                                    : item,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Average Views</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={platform.avgViews}
                            onChange={(e) =>
                              setPlatforms((prev) =>
                                prev.map((item) =>
                                  item.id === platform.id ? { ...item, avgViews: Number(e.target.value) } : item,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={() => onUpdatePlatform(platform)}
                            disabled={sectionLoading === `platform-save-${platform.id}`}
                            className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                          >
                            {sectionLoading === `platform-save-${platform.id}` ? "Saving..." : "Save Platform"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => onDeletePlatform(platform.id)}
                            disabled={sectionLoading === `platform-delete-${platform.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-[#F9FAFB]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Platform</label>
                          <Select
                            value={newPlatform.platform}
                            onValueChange={(value) => setNewPlatform((prev) => ({ ...prev, platform: value }))}
                          >
                            <SelectTrigger className="mt-2 h-11 border-gray-200 rounded-xl">
                              <SelectValue placeholder="Choose platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {PLATFORM_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Profile URL</label>
                          <input
                            value={newPlatform.profileUrl}
                            onChange={(e) => setNewPlatform((prev) => ({ ...prev, profileUrl: e.target.value }))}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                            placeholder="https://platform.com/creator"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Followers Count</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={newPlatform.followersCount}
                            onChange={(e) =>
                              setNewPlatform((prev) => ({ ...prev, followersCount: e.target.value }))
                            }
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Average Views</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={newPlatform.avgViews}
                            onChange={(e) => setNewPlatform((prev) => ({ ...prev, avgViews: e.target.value }))}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={onAddPlatform}
                        disabled={sectionLoading === "platform-add"}
                        className="mt-4 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {sectionLoading === "platform-add" ? "Adding..." : "Add Platform"}
                      </Button>
                    </div>
                  )}

                  <div className="mt-6">
                    {isEditing ? (
                      <Button
                        type="button"
                        onClick={() => finishTabEditing("Platform changes saved.")}
                        className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
                      >
                        Save Platforms
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
                        Edit Platforms
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audience-age" className="mt-0">
                <div className="space-y-4">
                  {audienceAges.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-4 bg-[#FBFCFE]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Age Begin</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={item.ageBegin}
                            onChange={(e) =>
                              setAudienceAges((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, ageBegin: Number(e.target.value) } : entry,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Age End</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={item.ageEnd}
                            onChange={(e) =>
                              setAudienceAges((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, ageEnd: Number(e.target.value) } : entry,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Percentage</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={item.percentage}
                            onChange={(e) =>
                              setAudienceAges((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, percentage: Number(e.target.value) } : entry,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={() => onUpdateAudienceAge(item)}
                            disabled={sectionLoading === `age-save-${item.id}`}
                            className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                          >
                            {sectionLoading === `age-save-${item.id}` ? "Saving..." : "Save Row"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => onDeleteAudienceAge(item.id)}
                            disabled={sectionLoading === `age-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-[#F9FAFB]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Age Begin</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={newAge.ageBegin}
                            onChange={(e) => setNewAge((prev) => ({ ...prev, ageBegin: e.target.value }))}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Age End</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={newAge.ageEnd}
                            onChange={(e) => setNewAge((prev) => ({ ...prev, ageEnd: e.target.value }))}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Percentage</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={newAge.percentage}
                            onChange={(e) => setNewAge((prev) => ({ ...prev, percentage: e.target.value }))}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={onAddAudienceAge}
                        disabled={sectionLoading === "age-add"}
                        className="mt-4 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {sectionLoading === "age-add" ? "Adding..." : "Add Age Row"}
                      </Button>
                    </div>
                  )}

                  <div className="mt-6">
                    {isEditing ? (
                      <Button
                        type="button"
                        onClick={() => finishTabEditing("Audience age changes saved.")}
                        className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
                      >
                        Save Audience Age
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
                        Edit Audience Age
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audience-country" className="mt-0">
                <div className="space-y-4">
                  {audienceGeos.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-4 bg-[#FBFCFE]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Country</label>
                          <input
                            value={item.country?.name || ""}
                            disabled
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Percentage</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={item.percentage}
                            onChange={(e) =>
                              setAudienceGeos((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, percentage: Number(e.target.value) } : entry,
                                ),
                              )
                            }
                            disabled={!isEditing}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={() => onUpdateAudienceGeo(item)}
                            disabled={sectionLoading === `geo-save-${item.id}`}
                            className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                          >
                            {sectionLoading === `geo-save-${item.id}` ? "Saving..." : "Save Row"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => onDeleteAudienceGeo(item.id)}
                            disabled={sectionLoading === `geo-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-[#F9FAFB]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Country</label>
                          <Select
                            value={newGeo.countryId}
                            onValueChange={(value) => setNewGeo((prev) => ({ ...prev, countryId: value }))}
                          >
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

                        <div>
                          <label className="text-sm font-medium text-gray-700">Percentage</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={newGeo.percentage}
                            onChange={(e) => setNewGeo((prev) => ({ ...prev, percentage: e.target.value }))}
                            className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={onAddAudienceGeo}
                        disabled={sectionLoading === "geo-add"}
                        className="mt-4 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {sectionLoading === "geo-add" ? "Adding..." : "Add Country Row"}
                      </Button>
                    </div>
                  )}

                  <div className="mt-6">
                    {isEditing ? (
                      <Button
                        type="button"
                        onClick={() => finishTabEditing("Audience country changes saved.")}
                        className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 rounded-xl py-6 text-base"
                      >
                        Save Audience Country
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
                        Edit Audience Country
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
