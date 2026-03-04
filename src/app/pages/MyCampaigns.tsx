import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Sidebar from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
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

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;

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

async function resolveCompanyId(): Promise<number | null> {
  const cached = localStorage.getItem("companyProfile");
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as { id?: number };
      if (typeof parsed.id === "number") return parsed.id;
    } catch {
      // ignore
    }
  }

  const userId = Number(localStorage.getItem("userId"));
  if (!Number.isFinite(userId)) return null;

  const url = buildUrl("/api/v1/company", {
    page: "0",
    size: "200",
    sort: "createdAt,desc",
  });
  if (!url) return null;

  const page = await getJson<{ content: Array<{ id: number; userId: number }> }>(url);
  const matched = page.content?.find((c) => c.userId === userId);
  return matched?.id ?? null;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OfferForm>(DEFAULT_FORM);
  const [statusDraft, setStatusDraft] = useState<Record<number, string>>({});

  const canSubmit = useMemo(() => {
    return (
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      Number(form.categoryId) > 0 &&
      Number(form.budget) > 0 &&
      Number(form.targetMinAge) > 0 &&
      Number(form.targetMaxAge) >= Number(form.targetMinAge) &&
      !!form.campaignStartDate &&
      !!form.campaignEndDate
    );
  }, [form]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCompany) {
        const resolvedCompanyId = await resolveCompanyId();

        const categoriesUrl = buildUrl("/api/v1/category");
        if (!categoriesUrl) throw new Error("VITE_API_URL is not set.");
        const categoriesRes = await getJson<Category[]>(categoriesUrl);
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);

        if (!resolvedCompanyId) {
          setOffers([]);
          return;
        }

        const offersUrl = buildUrl(`/api/v1/offer/company/${resolvedCompanyId}`, {
          page: "0",
          size: "200",
          sort: "createdAt,desc",
        });
        if (!offersUrl) throw new Error("VITE_API_URL is not set.");
        const offersRes = await getJson<OfferPage>(offersUrl);
        const loadedOffers = Array.isArray(offersRes.content) ? offersRes.content : [];
        setOffers(loadedOffers);
        setStatusDraft(
          loadedOffers.reduce<Record<number, string>>((acc, offer) => {
            acc[offer.id] = offer.status || "DRAFT";
            return acc;
          }, {}),
        );
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
        const offersRes = await getJson<OfferPage>(offersUrl);
        const loadedOffers = Array.isArray(offersRes.content) ? offersRes.content : [];
        setOffers(loadedOffers);
        return;
      }

      setCategories([]);
      setOffers([]);
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
                    : "Campaign list available for your creator account."}
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
            <Card className="p-4 mb-4 border border-orange-200 bg-orange-50 text-orange-800">
              Creator accounts have read-only campaign access.
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
                    </div>

                    {isCompany && (
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

