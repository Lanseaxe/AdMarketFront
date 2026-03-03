import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreatorProfile from "./pages/CreatorProfile";
import MatchExplanation from "./pages/MatchExplanation";
import Conversations from "./pages/Conversations";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },

  {
    path: "/signin",
    Component: SignIn,
  },
  {
    path: "/signup",
    Component: SignUp,
  },

  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/creator/:id",
    Component: CreatorProfile,
  },
  {
    path: "/match/:id",
    Component: MatchExplanation,
  },
  {
    path: "/conversations",
    Component: Conversations,
  },

  {
    path: "/campaigns",
    element: (
      <PlaceholderPage
        title="My Campaigns"
        description="Campaign management features coming soon. View AI-recommended matches on the Dashboard."
      />
    ),
  },
  {
    path: "/matches",
    element: (
      <PlaceholderPage
        title="AI Matches"
        description="Browse all AI-matched creators here. Check the Dashboard for top recommendations."
      />
    ),
  },
  {
    path: "/analytics",
    element: (
      <PlaceholderPage
        title="Analytics"
        description="Detailed analytics and reporting features coming soon. View key metrics on the Dashboard."
      />
    ),
  },
  {
    path: "/profile",
    element: (
      <PlaceholderPage
        title="Profile Settings"
        description="Profile management features coming soon."
      />
    ),
  },

  {
    path: "*",
    Component: NotFound,
  },
]);