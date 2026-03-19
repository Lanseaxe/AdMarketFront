import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Sidebar from "../components/Sidebar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Search, Filter, SlidersHorizontal, Sparkles } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";
import { syncCurrentUserFromApi } from "../lib/user-session";
import type { ChatParticipant } from "../lib/chat";

type CreatorItem = {
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

type CompanyItem = {
  id: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
  companyName: string;
  industryName: string;
  description: string;
  websiteUrl: string;
  country: { id: number; name: string; code: string };
  minBudget: number;
  maxBudget: number;
};

type OfferItem = {
  id: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  campaignStartDate: string;
  campaignEndDate: string;
  status: string;
  category?: { id: number; name: string };
  company?: { id: number; companyName: string };
};

type OfferApplication = {
  id: number;
  offerId: number;
  offerTitle: string;
  creatorId: number;
  creatorDisplayName: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | string;
  createdAt: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  empty: boolean;
};

const CREATOR_SORT_OPTIONS = [
  { value: "displayName,asc", label: "Alphabetical (A-Z)" },
  { value: "displayName,desc", label: "Alphabetical (Z-A)" },
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "followersCount,desc", label: "Followers high to low" },
];

const COMPANY_SORT_OPTIONS = [
  { value: "companyName,asc", label: "Alphabetical (A-Z)" },
  { value: "companyName,desc", label: "Alphabetical (Z-A)" },
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "maxBudget,desc", label: "Budget high to low" },
];

const OFFER_SORT_OPTIONS = [
  { value: "title,asc", label: "Alphabetical (A-Z)" },
  { value: "title,desc", label: "Alphabetical (Z-A)" },
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "budget,desc", label: "Budget high to low" },
];

function buildPagedUrl(basePath: string, page: number, size: number, sort: string) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.append("sort", sort);
  return `${apiBase}${basePath}?${params.toString()}`;
}

async function fetchPaged<T>(url: string): Promise<PageResponse<T>> {
  const res = await fetchWithAuthRetry(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseBodySafe(res);
  if (!res.ok) {
    throw new Error(`Failed to load list (HTTP ${res.status})`);
  }
  if (!data || typeof data !== "object") {
    throw new Error("Invalid list response from backend.");
  }
  return data as PageResponse<T>;
}

async function createPaymentCheckout(): Promise<string> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/payment/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Failed to create checkout session (HTTP ${res.status})`);

  if (typeof data === "string" && data.trim()) return data.trim();
  throw new Error("Backend did not return a Stripe checkout link.");
}

async function fetchMyOfferApplications(): Promise<OfferApplication[]> {
  const url = buildPagedUrl("/api/v1/offer-application/my", 0, 200, "createdAt,desc");
  if (!url) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
  const page = await fetchPaged<OfferApplication>(url);
  return Array.isArray(page.content) ? page.content : [];
}

async function createOfferApplication(offerId: number, coverLetter: string): Promise<OfferApplication> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/offer-application`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offerId,
      coverLetter,
    }),
  });

  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Failed to apply to offer (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid offer application response.");
  return data as OfferApplication;
}

async function deleteOfferApplication(applicationId: number): Promise<void> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/offer-application/${applicationId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await parseBodySafe(res);
    throw new Error(
      typeof data === "string" && data ? data : `Failed to withdraw application (HTTP ${res.status})`,
    );
  }
}

function getApplicationBadgeClass(status: string) {
  if (status === "ACCEPTED") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (status === "REJECTED") return "bg-red-100 text-red-700 border border-red-200";
  if (status === "WITHDRAWN") return "bg-gray-100 text-gray-700 border border-gray-200";
  return "bg-amber-100 text-amber-700 border border-amber-200";
}

export default function Dashboard() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const isCreator = role === "CREATOR";

  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [creatorViewMode, setCreatorViewMode] = useState<"companies" | "offers">("companies");

  const [creatorSort, setCreatorSort] = useState("displayName,asc");
  const [companySort, setCompanySort] = useState("companyName,asc");
  const [offerSort, setOfferSort] = useState("createdAt,desc");
  const [creatorCategoryFilter, setCreatorCategoryFilter] = useState("ALL");
  const [companyIndustryFilter, setCompanyIndustryFilter] = useState("ALL");
  const [offerCategoryFilter, setOfferCategoryFilter] = useState("ALL");

  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [applications, setApplications] = useState<OfferApplication[]>([]);
  const [applyDialogOffer, setApplyDialogOffer] = useState<OfferItem | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applicationBusyId, setApplicationBusyId] = useState<number | null>(null);

  const buildConversationState = (
    userId: number,
    role: "COMPANY" | "CREATOR",
    participantName: string,
    email?: string,
  ) => {
    const participant: ChatParticipant = {
      id: userId,
      email: email || `${participantName} (${role})`,
      role,
      status: "ACTIVE",
    };

    return {
      participant,
      participantName,
    };
  };

  useEffect(() => {
    let active = true;
    const syncRole = async () => {
      const me = await syncCurrentUserFromApi();
      if (!active) return;
      setRole(me?.role || localStorage.getItem("role"));
    };
    syncRole();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isCreator) {
          if (creatorViewMode === "companies") {
            const url = buildPagedUrl("/api/v1/company", 0, 100, companySort);
            if (!url) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
            const page = await fetchPaged<CompanyItem>(url);
            if (!active) return;
            setCompanies(Array.isArray(page.content) ? page.content : []);
            setTotalCount(page.totalElements || 0);
          } else {
            const url = buildPagedUrl("/api/v1/offer", 0, 200, offerSort);
            if (!url) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
            const [page, myApplications] = await Promise.all([
              fetchPaged<OfferItem>(url),
              fetchMyOfferApplications(),
            ]);
            if (!active) return;
            const allOffers = Array.isArray(page.content) ? page.content : [];
            setOffers(allOffers);
            setApplications(myApplications);
            setTotalCount(page.totalElements || allOffers.length);
          }
        } else {
          const url = buildPagedUrl("/api/v1/creator", 0, 100, creatorSort);
          if (!url) throw new Error("VITE_API_URL is not set. Add it to your .env file.");
          const page = await fetchPaged<CreatorItem>(url);
          if (!active) return;
          setCreators(Array.isArray(page.content) ? page.content : []);
          setTotalCount(page.totalElements || 0);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [isCreator, creatorSort, companySort, creatorViewMode, offerSort]);

  const creatorCategories = useMemo(() => {
    const set = new Set(creators.map((c) => c.primaryCategoryName).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [creators]);

  const companyIndustries = useMemo(() => {
    const set = new Set(companies.map((c) => c.industryName).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const offerCategories = useMemo(() => {
    const set = new Set(offers.map((o) => o.category?.name).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [offers]);

  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creators.filter((item) => {
      const byName = (item.displayName || "").toLowerCase().includes(q);
      const byCategory =
        creatorCategoryFilter === "ALL" || item.primaryCategoryName === creatorCategoryFilter;
      return byName && byCategory;
    });
  }, [creators, query, creatorCategoryFilter]);

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((item) => {
      const byName = (item.companyName || "").toLowerCase().includes(q);
      const byIndustry =
        companyIndustryFilter === "ALL" || item.industryName === companyIndustryFilter;
      return byName && byIndustry;
    });
  }, [companies, query, companyIndustryFilter]);

  const filteredOffers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((item) => {
      if ((item.status || "").toUpperCase() !== "ACTIVE") return false;
      const byName =
        (item.title || "").toLowerCase().includes(q) ||
        (item.company?.companyName || "").toLowerCase().includes(q);
      const byCategory =
        offerCategoryFilter === "ALL" || item.category?.name === offerCategoryFilter;
      return byName && byCategory;
    });
  }, [offers, query, offerCategoryFilter]);

  const applicationsByOfferId = useMemo(() => {
    return applications.reduce<Record<number, OfferApplication>>((acc, application) => {
      acc[application.offerId] = application;
      return acc;
    }, {});
  }, [applications]);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className={`max-w-7xl mx-auto transition ${paymentDialogOpen ? "blur-sm" : ""}`}>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">
                {isCreator
                  ? "Discover companies and partnership opportunities."
                  : "Discover creators for your campaigns."}
              </p>
            </div>

            {!isCreator && (
              <Button
                type="button"
                onClick={() => setPaymentDialogOpen(true)}
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Buy AdMarket+
              </Button>
            )}
          </div>

          <Card className="p-6 bg-white border border-gray-200 rounded-xl mb-6">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    isCreator
                      ? creatorViewMode === "companies"
                        ? "Search companies by name..."
                        : "Search offers or company name..."
                      : "Search creators by name..."
                  }
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setFilterOpen((v) => !v)}
                className="border-[#3B82F6] text-[#3B82F6]"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {filterOpen && (
              <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-[#F9FAFB]">
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter options</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isCreator && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-600">Show</label>
                      <select
                        value={creatorViewMode}
                        onChange={(e) => setCreatorViewMode(e.target.value as "companies" | "offers")}
                        className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                      >
                        <option value="companies">Companies</option>
                        <option value="offers">All offers</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {isCreator
                        ? creatorViewMode === "companies"
                          ? "Industry"
                          : "Offer category"
                        : "Category"}
                    </label>
                    {isCreator ? (
                      creatorViewMode === "companies" ? (
                        <select
                          value={companyIndustryFilter}
                          onChange={(e) => setCompanyIndustryFilter(e.target.value)}
                          className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                        >
                          <option value="ALL">All industries</option>
                          {companyIndustries.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={offerCategoryFilter}
                          onChange={(e) => setOfferCategoryFilter(e.target.value)}
                          className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                        >
                          <option value="ALL">All offer categories</option>
                          {offerCategories.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <select
                        value={creatorCategoryFilter}
                        onChange={(e) => setCreatorCategoryFilter(e.target.value)}
                        className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                      >
                        <option value="ALL">All categories</option>
                        {creatorCategories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">Order</label>
                    {isCreator ? (
                      creatorViewMode === "companies" ? (
                        <select
                          value={companySort}
                          onChange={(e) => setCompanySort(e.target.value)}
                          className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                        >
                          {COMPANY_SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={offerSort}
                          onChange={(e) => setOfferSort(e.target.value)}
                          className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                        >
                          {OFFER_SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <select
                        value={creatorSort}
                        onChange={(e) => setCreatorSort(e.target.value)}
                        className="mt-1 w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
                      >
                        {CREATOR_SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="mb-5 text-sm text-gray-600">
            {loading
              ? "Loading users..."
              : `Showing ${
                  isCreator
                    ? creatorViewMode === "companies"
                      ? filteredCompanies.length
                      : filteredOffers.length
                    : filteredCreators.length
                } of ${totalCount}`}
          </div>

          {error && (
            <Card className="p-4 border border-red-200 bg-red-50 text-red-700 mb-6">{error}</Card>
          )}

          {!loading && !error && isCreator && creatorViewMode === "companies" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{company.companyName}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{company.country?.name || "Country N/A"}</p>
                    </div>
                    <Badge variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6]">
                      {company.industryName || "N/A"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">{company.description || "No description provided."}</p>

                  <div className="text-sm text-gray-700 mb-4">
                    Budget: <span className="font-medium">${company.minBudget}</span> -{" "}
                    <span className="font-medium">${company.maxBudget}</span>
                  </div>

                  <div className="flex gap-3">
                    <Link to={`/company/${company.id}`} className="flex-1">
                      <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">View Profile</Button>
                    </Link>
                    {company.websiteUrl ? (
                      <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full">Visit Website</Button>
                      </a>
                    ) : (
                      <Button disabled variant="outline" className="w-full">Website N/A</Button>
                    )}
                  </div>

                  <div className="mt-3">
                    <Link
                      to={`/conversations/${company.userId}`}
                      state={buildConversationState(company.userId, "COMPANY", company.companyName)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full border-[#3B82F6] text-[#3B82F6]">
                        Message in Conversations
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && isCreator && creatorViewMode === "offers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOffers.map((offer) => (
                <Card
                  key={offer.id}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{offer.company?.companyName || "Unknown company"}</p>
                    </div>
                    <Badge variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6]">
                      {offer.category?.name || "N/A"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {offer.description || "No description provided."}
                  </p>

                  <p className="text-sm text-gray-700 mb-1">
                    Budget: {offer.budget} {offer.currency}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {offer.campaignStartDate} to {offer.campaignEndDate}
                  </p>

                  <div className="space-y-3">
                    {offer.company?.id ? (
                      <Link to={`/company/${offer.company.id}`} className="block">
                        <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">View Company</Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full">Company unavailable</Button>
                    )}

                    {applicationsByOfferId[offer.id] && (
                      <div className="rounded-lg border border-gray-200 bg-[#F9FAFB] p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-gray-700">Your application</span>
                          <Badge className={getApplicationBadgeClass(applicationsByOfferId[offer.id].status)}>
                            {applicationsByOfferId[offer.id].status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          Submitted {new Date(applicationsByOfferId[offer.id].createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {(() => {
                      const application = applicationsByOfferId[offer.id];
                      const canApply = !application || application.status === "WITHDRAWN";
                      const canWithdraw = application?.status === "PENDING";

                      if (canApply) {
                        return (
                          <Button
                            variant="outline"
                            className="w-full border-[#3B82F6] text-[#3B82F6]"
                            onClick={() => {
                              setCoverLetter("");
                              setApplyDialogOffer(offer);
                            }}
                          >
                            {application ? "Apply Again" : "Apply to Offer"}
                          </Button>
                        );
                      }

                      if (canWithdraw && application) {
                        return (
                          <Button
                            variant="outline"
                            className="w-full text-red-600"
                            disabled={applicationBusyId === application.id}
                            onClick={async () => {
                              try {
                                setApplicationBusyId(application.id);
                                await deleteOfferApplication(application.id);
                                setApplications((prev) => prev.filter((item) => item.id !== application.id));
                              } catch (err: any) {
                                setError(err?.message || "Failed to withdraw application.");
                              } finally {
                                setApplicationBusyId(null);
                              }
                            }}
                          >
                            Withdraw Application
                          </Button>
                        );
                      }

                      return (
                        <Button disabled variant="outline" className="w-full">
                          Application {application?.status || "Submitted"}
                        </Button>
                      );
                    })()}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && !isCreator && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCreators.map((creator) => (
                <Card
                  key={creator.id}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{creator.displayName}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{creator.contactEmail}</p>
                    </div>
                    <Badge variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6]">
                      {creator.primaryCategoryName || "N/A"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">{creator.bio || "No bio provided."}</p>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="rounded-lg bg-[#F9FAFB] p-3 border border-gray-200">
                      <div className="text-gray-500 text-xs">Followers</div>
                      <div className="font-medium text-gray-900">{creator.followersCount}</div>
                    </div>
                    <div className="rounded-lg bg-[#F9FAFB] p-3 border border-gray-200">
                      <div className="text-gray-500 text-xs">Avg Views</div>
                      <div className="font-medium text-gray-900">{creator.avgViews}</div>
                    </div>
                    <div className="rounded-lg bg-[#F9FAFB] p-3 border border-gray-200">
                      <div className="text-gray-500 text-xs">Engagement</div>
                      <div className="font-medium text-gray-900">{creator.engagementRate}%</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link to={`/creator/${creator.id}`} className="block">
                      <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">View Profile</Button>
                    </Link>
                    <Link
                      to={`/conversations/${creator.userId}`}
                      state={buildConversationState(
                        creator.userId,
                        "CREATOR",
                        creator.displayName,
                        creator.contactEmail,
                      )}
                      className="block"
                    >
                      <Button variant="outline" className="w-full border-[#3B82F6] text-[#3B82F6]">
                        Message in Conversations
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && isCreator && creatorViewMode === "companies" && filteredCompanies.length === 0 && (
            <Card className="p-8 text-center text-gray-600 border border-gray-200">No companies found.</Card>
          )}

          {!loading && !error && isCreator && creatorViewMode === "offers" && filteredOffers.length === 0 && (
            <Card className="p-8 text-center text-gray-600 border border-gray-200">No offers found.</Card>
          )}

          {!loading && !error && !isCreator && filteredCreators.length === 0 && (
            <Card className="p-8 text-center text-gray-600 border border-gray-200">No creators found.</Card>
          )}

        </div>

        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buy AdMarket+</DialogTitle>
              <DialogDescription>
                Are you sure you want to buy AdMarket+?
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-blue-100 bg-[#EFF6FF] p-4 text-sm text-[#1E3A8A]">
              Premium subscription unlocks the Stripe checkout flow for your company account.
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={startingCheckout}
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                onClick={async () => {
                  try {
                    setStartingCheckout(true);
                    const checkoutUrl = await createPaymentCheckout();
                    window.location.href = checkoutUrl;
                  } catch (err: any) {
                    setError(err?.message || "Failed to start payment.");
                    setPaymentDialogOpen(false);
                  } finally {
                    setStartingCheckout(false);
                  }
                }}
              >
                {startingCheckout ? "Redirecting..." : "Continue to Stripe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(applyDialogOffer)}
          onOpenChange={(open) => {
            if (!open) {
              setApplyDialogOffer(null);
              setCoverLetter("");
            }
          }}
        >
          <DialogContent className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply to Offer</DialogTitle>
              <DialogDescription>
                {applyDialogOffer
                  ? `Send your application for "${applyDialogOffer.title}".`
                  : "Submit your offer application."}
              </DialogDescription>
            </DialogHeader>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cover Letter</label>
              <textarea
                rows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Introduce yourself, explain why you're a fit, and include your idea for this campaign."
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3B82F6]/30"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApplyDialogOffer(null);
                  setCoverLetter("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={applySubmitting || !applyDialogOffer || !coverLetter.trim()}
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                onClick={async () => {
                  if (!applyDialogOffer) return;
                  try {
                    setApplySubmitting(true);
                    const application = await createOfferApplication(applyDialogOffer.id, coverLetter.trim());
                    setApplications((prev) => {
                      const next = prev.filter((item) => item.offerId !== application.offerId);
                      return [application, ...next];
                    });
                    setApplyDialogOffer(null);
                    setCoverLetter("");
                  } catch (err: any) {
                    setError(err?.message || "Failed to submit application.");
                  } finally {
                    setApplySubmitting(false);
                  }
                }}
              >
                {applySubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
