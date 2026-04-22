import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Sidebar from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import UserAvatar from "../components/UserAvatar";
import { ArrowLeft, Plus, Pencil, Trash2, RefreshCw, Users, Sparkles, Eye, Mail } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";

type Category = { id: number; name: string };

type Offer = {
  id: number;
  createdAt: string;
  updatedAt: string;
  company: { id: number; userId: number; companyName: string };
  title: string;
  description: string;
  category: { id: number; name: string };
  budget: number;
  currency: string;
  targetMinAge: number;
  targetMaxAge: number;
  campaignStartDate: string;
  campaignEndDate: string;
  status: string;
};

type OfferPage = { content: Offer[]; totalElements: number };

type OfferApplication = {
  id: number;
  offerId: number;
  offerTitle: string;
  creatorId: number;
  creatorDisplayName: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | string;
  createdAt: string;
};

type OfferApplicationPage = {
  content: OfferApplication[];
  totalElements: number;
};

type CreatorSummary = {
  id: number;
  userId: number;
  displayName: string;
  bio: string;
  primaryCategoryName: string;
  followersCount: number;
  avgViews: number;
  engagementRate: number;
  contactEmail: string;
  avatar?: string | null;
};

type PredictionResponse = {
  creator_id: number;
  offer_id: number;
  success_probability: number;
};

type OfferForm = {
  title: string;
  description: string;
  categoryId: string;
  budget: string;
  currency: string;
  targetMinAge: string;
  targetMaxAge: string;
  campaignStartDate: string;
  campaignEndDate: string;
};

const DEFAULT_FORM: OfferForm = {
  title: "",
  description: "",
  categoryId: "",
  budget: "0.01",
  currency: "USD",
  targetMinAge: "18",
  targetMaxAge: "65",
  campaignStartDate: "",
  campaignEndDate: "",
};

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const APPLICATION_STATUS_OPTIONS = ["PENDING", "ACCEPTED", "REJECTED"] as const;
const PREDICTION_API_BASE =
  (import.meta.env.VITE_PREDICTION_API_URL as string | undefined)?.trim() || "/ml-api";

function buildPredictionUrl(creatorId: number, offerId: number) {
  const rawBase = PREDICTION_API_BASE.trim();
  const isAbsolute = rawBase.startsWith("http://") || rawBase.startsWith("https://");
  const url = isAbsolute
    ? new URL(rawBase)
    : new URL(rawBase, window.location.origin);

  if (!/\/predict\/?$/i.test(url.pathname)) {
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/predict`;
  }

  url.searchParams.set("creator_id", String(creatorId));
  url.searchParams.set("offer_id", String(offerId));
  return url;
}

function buildUrl(path: string, params?: Record<string, string>) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;
  const url = new URL(`${apiBase}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function getJson<T>(url: string) {
  const res = await fetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
  return data as T;
}

async function mutateJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetchWithAuthRetry(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
  return data as T;
}

async function updateOfferStatus(offerId: number, nextStatus: string): Promise<void> {
  const urlWithStatus = buildUrl(`/api/v1/offer/status/${offerId}`, { offerStatus: nextStatus });
  if (!urlWithStatus) throw new Error("VITE_API_URL is not set.");

  // Primary backend format: /api/v1/offer/status/{id}?offerStatus=...
  await mutateJson<Offer>(urlWithStatus, "PUT");
}

async function fetchOfferApplications(offerId: number): Promise<OfferApplication[]> {
  const url = buildUrl(`/api/v1/offer-application/offer/${offerId}`, {
    page: "0",
    size: "200",
    sort: "createdAt,desc",
  });
  if (!url) throw new Error("VITE_API_URL is not set.");

  const data = await getJson<OfferApplicationPage>(url);
  return Array.isArray(data.content) ? data.content : [];
}

async function fetchMyOfferApplications(): Promise<OfferApplication[]> {
  const url = buildUrl("/api/v1/offer-application/my", {
    page: "0",
    size: "200",
    sort: "createdAt,desc",
  });
  if (!url) throw new Error("VITE_API_URL is not set.");

  const data = await getJson<OfferApplicationPage>(url);
  return Array.isArray(data.content) ? data.content : [];
}

async function updateApplicationStatus(applicationId: number, nextStatus: string): Promise<OfferApplication> {
  const url = buildUrl(`/api/v1/offer-application/${applicationId}/status`, { status: nextStatus });
  if (!url) throw new Error("VITE_API_URL is not set.");
  return mutateJson<OfferApplication>(url, "PUT");
}

async function fetchCreatorSummary(creatorId: number): Promise<CreatorSummary | null> {
  const url = buildUrl(`/api/v1/creator/${creatorId}`);
  if (!url) throw new Error("VITE_API_URL is not set.");

  const res = await fetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseBodySafe(res);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load creator details (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid creator details response.");
  return data as CreatorSummary;
}

async function fetchOfferPrediction(creatorId: number, offerId: number): Promise<number | null> {
  const coerceProbability = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const normalized = value.trim().replace("%", "");
      if (!normalized) return null;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const extractProbability = (payload: unknown, depth = 0): number | null => {
    if (depth > 4) return null;

    const direct = coerceProbability(payload);
    if (direct !== null) return direct;

    if (typeof payload === "string") {
      const normalized = payload.trim();
      if (!normalized) return null;
      try {
        return extractProbability(JSON.parse(normalized), depth + 1);
      } catch {
        return null;
      }
    }

    if (Array.isArray(payload)) {
      for (const item of payload) {
        const probability = extractProbability(item, depth + 1);
        if (probability !== null) return probability;
      }
      return null;
    }

    if (!payload || typeof payload !== "object") return null;
    const parsed = payload as Record<string, unknown>;

    const directFields = [
      parsed.success_probability,
      parsed.successProbability,
      parsed.probability,
      parsed.score,
      parsed.prediction,
      parsed.matchPrediction,
      parsed.value,
    ];

    for (const candidate of directFields) {
      const probability = coerceProbability(candidate);
      if (probability !== null) return probability;
    }

    const nestedFields = [
      parsed.data,
      parsed.result,
      parsed.payload,
      parsed.response,
      parsed.prediction,
      parsed.matchPrediction,
      parsed.body,
    ];

    for (const candidate of nestedFields) {
      const probability = extractProbability(candidate, depth + 1);
      if (probability !== null) return probability;
    }

    return null;
  };

  const url = buildPredictionUrl(creatorId, offerId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await parseBodySafe(res);
  if (!res.ok) {
    throw new Error(`Failed to load success probability (HTTP ${res.status})`);
  }
  const probability = extractProbability(data);
  if (probability !== null) return probability;
  throw new Error("Prediction service returned an unsupported response format.");
}

function getApplicationBadgeClass(status: string) {
  if (status === "ACCEPTED") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (status === "REJECTED") return "bg-red-100 text-red-700 border border-red-200";
  if (status === "WITHDRAWN") return "bg-gray-100 text-gray-700 border border-gray-200";
  return "bg-amber-100 text-amber-700 border border-amber-200";
}

function toPayload(form: OfferForm) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    categoryId: Number(form.categoryId),
    budget: Number(form.budget),
    currency: form.currency.trim().toUpperCase(),
    targetMinAge: Number(form.targetMinAge),
    targetMaxAge: Number(form.targetMaxAge),
    campaignStartDate: form.campaignStartDate,
    campaignEndDate: form.campaignEndDate,
  };
}

export default function MyCampaigns() {
  const role = localStorage.getItem("role");
  const isCompany = role === "COMPANY";
  const isCreator = role === "CREATOR";

  const [offers, setOffers] = useState<Offer[]>([]);
  const [myApplications, setMyApplications] = useState<OfferApplication[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OfferForm>(DEFAULT_FORM);
  const [statusDraft, setStatusDraft] = useState<Record<number, string>>({});
  const [applicationsByOffer, setApplicationsByOffer] = useState<Record<number, OfferApplication[]>>({});
  const [applicationStatusDraft, setApplicationStatusDraft] = useState<Record<number, string>>({});
  const [applicationsLoadingOfferId, setApplicationsLoadingOfferId] = useState<number | null>(null);
  const [applicationSavingId, setApplicationSavingId] = useState<number | null>(null);
  const [creatorDetailsById, setCreatorDetailsById] = useState<Record<number, CreatorSummary | null>>({});
  const [predictionByKey, setPredictionByKey] = useState<Record<string, number | null>>({});
  const [predictionErrorByKey, setPredictionErrorByKey] = useState<Record<string, string>>({});

  const parsedCampaignStartDate = form.campaignStartDate ? new Date(form.campaignStartDate) : null;
  const parsedCampaignEndDate = form.campaignEndDate ? new Date(form.campaignEndDate) : null;
  const hasInvalidCampaignDateRange = Boolean(
    parsedCampaignStartDate &&
      parsedCampaignEndDate &&
      !Number.isNaN(parsedCampaignStartDate.getTime()) &&
      !Number.isNaN(parsedCampaignEndDate.getTime()) &&
      parsedCampaignEndDate < parsedCampaignStartDate,
  );

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      Number(form.categoryId) > 0 &&
      Number(form.budget) > 0 &&
      Number(form.targetMinAge) > 0 &&
      Number(form.targetMaxAge) >= Number(form.targetMinAge) &&
      !!form.campaignStartDate &&
      !!form.campaignEndDate &&
      !hasInvalidCampaignDateRange
    );
  }, [form, hasInvalidCampaignDateRange]);

  const getPredictionKey = (creatorId: number, offerId: number) => `${creatorId}:${offerId}`;

  const hydrateApplicationsMeta = async (
    entries: readonly (readonly [number, OfferApplication[]])[],
  ) => {
    const uniqueCreatorIds = Array.from(
      new Set(entries.flatMap(([, items]) => items.map((item) => item.creatorId)).filter(Boolean)),
    );

    const creatorPairs = await Promise.all(
      uniqueCreatorIds.map(async (creatorId) => {
        try {
          const details = await fetchCreatorSummary(creatorId);
          return [creatorId, details] as const;
        } catch {
          return [creatorId, null] as const;
        }
      }),
    );

    setCreatorDetailsById((prev) => ({
      ...prev,
      ...creatorPairs.reduce<Record<number, CreatorSummary | null>>((acc, [creatorId, details]) => {
        acc[creatorId] = details;
        return acc;
      }, {}),
    }));

    const predictionPairs = await Promise.all(
      entries.flatMap(([offerId, items]) =>
        items.map(async (item) => {
          const key = getPredictionKey(item.creatorId, offerId);
          try {
            const probability = await fetchOfferPrediction(item.creatorId, offerId);
            return { key, probability, error: null as string | null };
          } catch (err: any) {
            return { key, probability: null, error: err?.message || "Prediction unavailable." };
          }
        }),
      ),
    );

    setPredictionByKey((prev) => ({
      ...prev,
      ...predictionPairs.reduce<Record<string, number | null>>((acc, item) => {
        acc[item.key] = item.probability;
        return acc;
      }, {}),
    }));

    setPredictionErrorByKey((prev) => ({
      ...prev,
      ...predictionPairs.reduce<Record<string, string>>((acc, item) => {
        if (item.error) acc[item.key] = item.error;
        return acc;
      }, {}),
    }));
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCompany) {
        const categoriesUrl = buildUrl("/api/v1/category");
        const offersUrl = buildUrl("/api/v1/offer/my", {
          page: "0",
          size: "200",
          sort: "createdAt,desc",
        });
        if (!categoriesUrl || !offersUrl) throw new Error("VITE_API_URL is not set.");

        const [categoriesRes, offersRes] = await Promise.all([
          getJson<Category[]>(categoriesUrl),
          getJson<OfferPage | Offer[]>(offersUrl),
        ]);

        setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
        const loadedOffers = Array.isArray(offersRes)
          ? offersRes
          : Array.isArray(offersRes.content)
            ? offersRes.content
            : [];
        setOffers(loadedOffers);
        setStatusDraft(
          loadedOffers.reduce<Record<number, string>>((acc, offer) => {
            acc[offer.id] = offer.status || "DRAFT";
            return acc;
          }, {}),
        );
        const applicationEntries = await Promise.all(
          loadedOffers.map(async (offer) => [offer.id, await fetchOfferApplications(offer.id)] as const),
        );
        setApplicationsByOffer(
          applicationEntries.reduce<Record<number, OfferApplication[]>>((acc, [offerId, items]) => {
            acc[offerId] = items;
            return acc;
          }, {}),
        );
        setApplicationStatusDraft(
          applicationEntries.reduce<Record<number, string>>((acc, [, items]) => {
            items.forEach((item) => {
              acc[item.id] = item.status;
            });
            return acc;
          }, {}),
        );
        await hydrateApplicationsMeta(applicationEntries);
        return;
      }

      if (isCreator) {
        setCategories([]);
        const offersUrl = buildUrl("/api/v1/offer", {
          page: "0",
          size: "200",
          sort: "createdAt,desc",
        });
        if (!offersUrl) throw new Error("VITE_API_URL is not set.");
        const [offersRes, applicationsRes] = await Promise.all([
          getJson<OfferPage | Offer[]>(offersUrl),
          fetchMyOfferApplications(),
        ]);
        const loadedOffers = Array.isArray(offersRes)
          ? offersRes
          : Array.isArray(offersRes.content)
            ? offersRes.content
            : [];
        setOffers(loadedOffers);
        setMyApplications(applicationsRes);
        return;
      }

      setCategories([]);
      setOffers([]);
      setMyApplications([]);
    } catch (err: any) {
      setError(err?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreate = () => {
    if (!isCompany) return;
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEdit = (offer: Offer) => {
    if (!isCompany) return;
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description,
      categoryId: String(offer.category?.id || ""),
      budget: String(offer.budget),
      currency: offer.currency,
      targetMinAge: String(offer.targetMinAge),
      targetMaxAge: String(offer.targetMaxAge),
      campaignStartDate: offer.campaignStartDate,
      campaignEndDate: offer.campaignEndDate,
    });
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!isCompany) return;
    if (!canSubmit) return;
    try {
      setSaving(true);
      const payload = toPayload(form);

      if (editingId) {
        const url = buildUrl(`/api/v1/offer/${editingId}`);
        if (!url) throw new Error("VITE_API_URL is not set.");
        await mutateJson<Offer>(url, "PUT", payload);
      } else {
        const url = buildUrl("/api/v1/offer");
        if (!url) throw new Error("VITE_API_URL is not set.");
        await mutateJson<Offer>(url, "POST", payload);
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to save campaign.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (offerId: number) => {
    if (!isCompany) return;
    try {
      const nextStatus = statusDraft[offerId];
      if (!nextStatus) throw new Error("Select status first.");

      await updateOfferStatus(offerId, nextStatus);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to change status.");
    }
  };

  const deleteOffer = async (offerId: number) => {
    if (!isCompany) return;
    const confirmed = window.confirm("Delete this campaign?");
    if (!confirmed) return;

    try {
      const byIdUrl = buildUrl(`/api/v1/offer/${offerId}`);
      if (byIdUrl) {
        await mutateJson<Offer>(byIdUrl, "DELETE");
      } else {
        throw new Error("VITE_API_URL is not set.");
      }
      await loadAll();
    } catch {
      try {
        const fallbackUrl = buildUrl("/api/v1/offer", { id: String(offerId) });
        if (!fallbackUrl) throw new Error("VITE_API_URL is not set.");
        await mutateJson<Offer>(fallbackUrl, "DELETE");
        await loadAll();
      } catch (err: any) {
        setError(err?.message || "Failed to delete campaign.");
      }
    }
  };

  const refreshOfferApplications = async (offerId: number) => {
    try {
      setApplicationsLoadingOfferId(offerId);
      const items = await fetchOfferApplications(offerId);
      setApplicationsByOffer((prev) => ({
        ...prev,
        [offerId]: items,
      }));
      setApplicationStatusDraft((prev) => {
        const next = { ...prev };
        items.forEach((item) => {
          next[item.id] = item.status;
        });
        return next;
      });
      await hydrateApplicationsMeta([[offerId, items]] as const);
    } catch (err: any) {
      setError(err?.message || "Failed to load applications.");
    } finally {
      setApplicationsLoadingOfferId(null);
    }
  };

  const changeApplicationStatus = async (offerId: number, applicationId: number) => {
    try {
      const nextStatus = applicationStatusDraft[applicationId];
      if (!nextStatus) throw new Error("Select application status first.");

      setApplicationSavingId(applicationId);
      const updated = await updateApplicationStatus(applicationId, nextStatus);
      setApplicationsByOffer((prev) => ({
        ...prev,
        [offerId]: (prev[offerId] || []).map((item) => (item.id === applicationId ? updated : item)),
      }));
      setApplicationStatusDraft((prev) => ({
        ...prev,
        [applicationId]: updated.status,
      }));
    } catch (err: any) {
      setError(err?.message || "Failed to update application status.");
    } finally {
      setApplicationSavingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="p-6 bg-white border border-gray-200 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isCompany
                    ? "Create and manage campaign offers. Only ACTIVE offers are visible to other users."
                    : "Track the offers you applied to and monitor each application status."}
                </p>
              </div>
              {isCompany && (
                <Button onClick={openCreate} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              )}
            </div>
          </Card>

          {isCreator && (
            <Card className="p-4 mb-4 border border-blue-200 bg-blue-50 text-blue-800">
              Creator accounts can review their submitted applications here.
            </Card>
          )}

          {error && (
            <Card className="p-4 mb-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
          )}

          {formOpen && (
            <Card className="p-6 mb-6 bg-white border border-gray-200 rounded-xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingId ? "Edit Campaign" : "Create Campaign"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}
                    className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                  >
                    <option value="">Choose category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Currency</label>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Budget</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.budget}
                    onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Target Min Age</label>
                  <input
                    type="number"
                    min={1}
                    value={form.targetMinAge}
                    onChange={(e) => setForm((s) => ({ ...s, targetMinAge: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Target Max Age</label>
                  <input
                    type="number"
                    min={1}
                    value={form.targetMaxAge}
                    onChange={(e) => setForm((s) => ({ ...s, targetMaxAge: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Campaign Start Date</label>
                  <input
                    type="date"
                    value={form.campaignStartDate}
                    onChange={(e) => setForm((s) => ({ ...s, campaignStartDate: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Campaign End Date</label>
                  <input
                    type="date"
                    value={form.campaignEndDate}
                    onChange={(e) => setForm((s) => ({ ...s, campaignEndDate: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                  {hasInvalidCampaignDateRange && (
                    <p className="mt-2 text-sm text-red-600">
                      Campaign end date cannot be earlier than the start date.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <Button
                  onClick={submitForm}
                  disabled={!canSubmit || saving}
                  className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Campaign"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingId(null);
                    setForm(DEFAULT_FORM);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {loading ? (
            <Card className="p-6 border border-gray-200">Loading campaigns...</Card>
          ) : isCreator ? (
            myApplications.length === 0 ? (
              <Card className="p-6 border border-gray-200 text-gray-600">
                You have not applied to any offers yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myApplications.map((application) => {
                  const offer = offers.find((item) => item.id === application.offerId);

                  return (
                    <Card key={application.id} className="p-5 bg-white border border-gray-200 rounded-xl">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {offer?.title || application.offerTitle || `Offer #${application.offerId}`}
                            </h3>
                            <Badge className={getApplicationBadgeClass(application.status)}>
                              {application.status}
                            </Badge>
                          </div>

                          <p className="mb-2 text-sm text-gray-700">
                            {offer?.description || "Offer details are not available in this view."}
                          </p>

                          <div className="text-sm text-gray-600">
                            Company: {offer?.company?.companyName || "Unknown company"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Category: {offer?.category?.name || "N/A"} | Budget:{" "}
                            {offer ? `${offer.budget} ${offer.currency}` : "N/A"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Applied: {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                          {offer && (
                            <div className="text-sm text-gray-600">
                              Campaign dates: {offer.campaignStartDate} to {offer.campaignEndDate}
                            </div>
                          )}
                        </div>

                        <div className="w-full md:w-[260px] space-y-3">
                          <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Application Status</div>
                            <div className="mt-2 text-lg font-semibold text-gray-900">{application.status}</div>
                          </div>

                          {offer?.company?.id ? (
                            <Link to={`/company/${offer.company.id}`} className="block">
                              <Button variant="outline" className="w-full">
                                View Company
                              </Button>
                            </Link>
                          ) : (
                            <Button disabled variant="outline" className="w-full">
                              Company unavailable
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : offers.length === 0 ? (
            <Card className="p-6 border border-gray-200 text-gray-600">No campaigns yet.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {offers.map((offer) => (
                <Card key={offer.id} className="p-5 bg-white border border-gray-200 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                        <Badge
                          className={
                            offer.status === "ACTIVE"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{offer.description}</p>
                      <div className="text-sm text-gray-600">
                        Category: {offer.category?.name || "N/A"} | Budget: {offer.budget} {offer.currency}
                      </div>
                      <div className="text-sm text-gray-600">
                        Ages: {offer.targetMinAge}-{offer.targetMaxAge} | Dates: {offer.campaignStartDate} to{" "}
                        {offer.campaignEndDate}
                      </div>

                      {isCompany && (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-[#F9FAFB] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-[#1E3A8A]" />
                              <span className="font-medium text-gray-900">Applications</span>
                            </div>
                            <Button
                              variant="ghost"
                              className="h-8 px-2 text-sm"
                              disabled={applicationsLoadingOfferId === offer.id}
                              onClick={() => void refreshOfferApplications(offer.id)}
                            >
                              Refresh
                            </Button>
                          </div>

                          {applicationsLoadingOfferId === offer.id && (
                            <div className="text-sm text-gray-500">Loading applications...</div>
                          )}

                          {applicationsLoadingOfferId !== offer.id && (applicationsByOffer[offer.id] || []).length === 0 && (
                            <div className="text-sm text-gray-500">No applications yet.</div>
                          )}

                          <div className="space-y-3">
                            {(applicationsByOffer[offer.id] || []).map((application) => (
                              <div key={application.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                {(() => {
                                  const creator = creatorDetailsById[application.creatorId];
                                  const predictionKey = getPredictionKey(application.creatorId, offer.id);
                                  const probability = predictionByKey[predictionKey];
                                  const predictionError = predictionErrorByKey[predictionKey];

                                  return (
                                    <>
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <UserAvatar
                                            avatar={creator?.avatar}
                                            label={creator?.displayName || application.creatorDisplayName}
                                            className="h-11 w-11 rounded-xl"
                                            fallbackClassName="rounded-xl bg-[#1E3A8A] text-sm font-semibold text-white"
                                          />
                                          <div>
                                            <div className="font-medium text-gray-900">
                                              {creator?.displayName || application.creatorDisplayName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Applied {new Date(application.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                              Creator ID: {application.creatorId}
                                            </div>
                                          </div>
                                        </div>
                                        <Badge className={getApplicationBadgeClass(application.status)}>
                                          {application.status}
                                        </Badge>
                                      </div>

                                      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="rounded-lg border border-blue-100 bg-[#EFF6FF] p-3">
                                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#1E3A8A]">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Match Prediction
                                          </div>
                                          <div className="mt-2 text-2xl font-bold text-[#1E3A8A]">
                                            {typeof probability === "number" ? `${probability.toFixed(2)}%` : "N/A"}
                                          </div>
                                          <div className="mt-1 text-xs text-gray-600">
                                            {predictionError || "Estimated success probability for this creator and offer."}
                                          </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-3">
                                          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Creator Snapshot
                                          </div>
                                          <div className="mt-2 text-sm text-gray-700">
                                            Category: {creator?.primaryCategoryName || "N/A"}
                                          </div>
                                          <div className="text-sm text-gray-700">
                                            Followers: {creator?.followersCount ?? "N/A"}
                                          </div>
                                          <div className="text-sm text-gray-700">
                                            Avg Views: {creator?.avgViews ?? "N/A"}
                                          </div>
                                          <div className="text-sm text-gray-700">
                                            Engagement: {typeof creator?.engagementRate === "number" ? `${creator.engagementRate}%` : "N/A"}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mb-3 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                          <Mail className="h-4 w-4 text-gray-400" />
                                          <span>{creator?.contactEmail || "Email unavailable"}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {creator?.bio?.trim() || "This creator has not added a bio yet."}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        <Link to={`/creator/${application.creatorId}`} className="inline-flex">
                                          <Button variant="outline">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Creator
                                          </Button>
                                        </Link>
                                        <select
                                          value={applicationStatusDraft[application.id] || application.status}
                                          onChange={(e) =>
                                            setApplicationStatusDraft((prev) => ({
                                              ...prev,
                                              [application.id]: e.target.value,
                                            }))
                                          }
                                          className="h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                                        >
                                          {APPLICATION_STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>
                                              {status}
                                            </option>
                                          ))}
                                        </select>
                                        <Button
                                          variant="outline"
                                          disabled={applicationSavingId === application.id}
                                          onClick={() => void changeApplicationStatus(offer.id, application.id)}
                                        >
                                          {applicationSavingId === application.id ? "Saving..." : "Update"}
                                        </Button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {isCompany && (
                      <div className="w-full md:w-[340px] md:flex-shrink-0">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => openEdit(offer)} disabled={formOpen}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <select
                            value={statusDraft[offer.id] || offer.status || "DRAFT"}
                            onChange={(e) =>
                              setStatusDraft((prev) => ({
                                ...prev,
                                [offer.id]: e.target.value,
                              }))
                            }
                            className="h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <Button variant="outline" onClick={() => changeStatus(offer.id)}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Update Status
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600"
                            onClick={() => deleteOffer(offer.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
