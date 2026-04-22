import { Navigate, Outlet } from "react-router";
import { getAccessToken } from "../lib/auth-storage";

export default function ProtectedLayout() {
  if (!getAccessToken()) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}
