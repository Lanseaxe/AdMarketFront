import { useEffect, useState } from "react";
import CompanyProfile from "./CompanyProfileSettings";
import CreatorProfileSettings from "./CreatorProfileSettings";
import { syncCurrentUserFromApi } from "../lib/user-session";

export default function ProfileSettings() {
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [loading, setLoading] = useState(true);

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

  if (role === "COMPANY") {
    return <CompanyProfile />;
  }

  return <CreatorProfileSettings />;
}
