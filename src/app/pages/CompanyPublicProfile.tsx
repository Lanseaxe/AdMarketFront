import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import UserAvatar from "../components/UserAvatar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Globe, MapPin, Wallet } from "lucide-react";
import { fetchWithAuthRetry, getApiBaseUrl, parseBodySafe } from "../lib/api-client";
import { fetchUserById, type BasicUserProfile } from "../lib/user-directory";

type CompanyDetails = {
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

type Offer = {
  id: number;
  title: string;
  description: string;
  budget: number;
  currency: string;
  campaignStartDate: string;
  campaignEndDate: string;
  status: string;
  category?: { id: number; name: string };
};

type OfferPage = { content: Offer[] };

async function fetchCompanyById(id: string): Promise<CompanyDetails> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const res = await fetchWithAuthRetry(`${apiBase}/api/v1/company/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Failed to load company profile (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid company response.");

  return data as CompanyDetails;
}

async function fetchCompanyOffers(companyId: string): Promise<Offer[]> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("VITE_API_URL is not set. Add it to your .env file.");

  const params = new URLSearchParams();
  params.set("page", "0");
  params.set("size", "100");
  params.append("sort", "createdAt,desc");

  const res = await fetchWithAuthRetry(
    `${apiBase}/api/v1/offer/company/${companyId}?${params.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await parseBodySafe(res);
  if (!res.ok) throw new Error(`Failed to load company offers (HTTP ${res.status})`);
  if (!data || typeof data !== "object") throw new Error("Invalid offers response.");

  const page = data as OfferPage;
  return Array.isArray(page.content) ? page.content : [];
}

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const role = localStorage.getItem("role");
  const isCreatorVisitor = role === "CREATOR";

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [user, setUser] = useState<BasicUserProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) {
        setError("Company id is missing.");
        setLoading(false);
        return;
      }
      try {
        const result = await fetchCompanyById(id);
        if (!active) return;
        setCompany(result);
        const userProfile = await fetchUserById(result.userId).catch(() => null);
        if (!active) return;
        setUser(userProfile);

        if (isCreatorVisitor) {
          setOffersLoading(true);
          setOffersError(null);
          try {
            const allOffers = await fetchCompanyOffers(id);
            if (!active) return;
            const activeOffers = allOffers.filter((offer) => offer.status?.toUpperCase() === "ACTIVE");
            setOffers(activeOffers);
          } catch (offersErr: any) {
            if (!active) return;
            setOffersError(offersErr?.message || "Failed to load active offers.");
          } finally {
            if (active) setOffersLoading(false);
          }
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Failed to load company.");
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

          {loading && <Card className="p-6 border border-gray-200">Loading company profile...</Card>}
          {error && <Card className="p-6 border border-red-200 bg-red-50 text-red-700">{error}</Card>}

          {!loading && !error && company && (
            <Card className="p-8 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-4">
                  <UserAvatar
                    avatar={user?.avatar}
                    label={company.companyName}
                    className="h-16 w-16 rounded-2xl"
                    fallbackClassName="rounded-2xl bg-[#1E3A8A] text-lg font-semibold text-white"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.companyName}</h1>
                    <p className="text-gray-600 mt-1">Company Profile</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-[#EFF6FF] text-[#3B82F6]">
                  {company.industryName || "N/A"}
                </Badge>
              </div>

              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {company.description || "No description provided."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4 bg-[#F9FAFB]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    Country
                  </div>
                  <div className="text-gray-900 font-medium">{company.country?.name || "N/A"}</div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-[#F9FAFB]">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Wallet className="w-4 h-4" />
                    Budget Range
                  </div>
                  <div className="text-gray-900 font-medium">
                    ${company.minBudget} - ${company.maxBudget}
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Globe className="w-4 h-4" />
                  Website
                </div>
                {company.websiteUrl ? (
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1E3A8A] hover:underline break-all"
                  >
                    {company.websiteUrl}
                  </a>
                ) : (
                  <span className="text-gray-900">N/A</span>
                )}
              </div>

              {isCreatorVisitor && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Active Offers</h2>

                  {offersLoading && (
                    <Card className="p-4 border border-gray-200">Loading active offers...</Card>
                  )}

                  {offersError && (
                    <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
                      {offersError}
                    </Card>
                  )}

                  {!offersLoading && !offersError && offers.length === 0 && (
                    <Card className="p-4 border border-gray-200 text-gray-600">
                      No active offers available.
                    </Card>
                  )}

                  {!offersLoading && !offersError && offers.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                      {offers.map((offer) => (
                        <Card key={offer.id} className="p-4 border border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                              <p className="text-sm text-gray-700 mt-1">
                                {offer.description || "No description provided."}
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                Budget: {offer.budget} {offer.currency}
                              </p>
                              <p className="text-sm text-gray-600">
                                {offer.campaignStartDate} to {offer.campaignEndDate}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border border-green-200">
                              ACTIVE
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
