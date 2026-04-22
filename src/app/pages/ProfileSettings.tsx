import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import CompanyProfile from "./CompanyProfileSettings";
import CreatorProfileSettings from "./CreatorProfileSettings";
import { syncCurrentUserFromApi } from "../lib/user-session";
import { getAccessToken } from "../lib/auth-storage";

export default function ProfileSettings() {
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [loading, setLoading] = useState(true);
  const isAuthenticated = Boolean(getAccessToken());

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const me = await syncCurrentUserFromApi();
        if (!active) return;
        setRole(me?.role || localStorage.getItem("role"));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#F9FAFB]" />;
  }

  if (!isAuthenticated || (role !== "COMPANY" && role !== "CREATOR")) {
    return <Navigate to="/signin" replace />;
  }

  if (role === "COMPANY") {
    return <CompanyProfile />;
  }

  return <CreatorProfileSettings />;
}
