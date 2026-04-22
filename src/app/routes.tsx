import { createBrowserRouter } from "react-router";
import RootLayout from "./components/RootLayout";
import ProtectedLayout from "./components/ProtectedLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreatorProfile from "./pages/CreatorProfile";
import CompanyPublicProfile from "./pages/CompanyPublicProfile";
import MatchExplanation from "./pages/MatchExplanation";
import Conversations from "./pages/Conversations";
import ConversationDetails from "./pages/ConversationDetails";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";
import MyCampaigns from "./pages/MyCampaigns";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ConfirmEmail from "./pages/ConfirmEmail";
import ForgotPasswordRequest from "./pages/ForgotPasswordRequest";
import ForgotPasswordReset from "./pages/ForgotPasswordReset";
import ProfileSettings from "./pages/ProfileSettings";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Analytics from "./pages/Analytics";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
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
        path: "/forgot-password",
        Component: ForgotPasswordRequest,
      },
      {
        path: "/forgot-password/reset",
        Component: ForgotPasswordReset,
      },
      {
        path: "/confirm-email",
        Component: ConfirmEmail,
      },
      {
        path: "/payment/success",
        Component: PaymentSuccess,
      },
      {
        path: "/payment/failed",
        Component: PaymentFailed,
      },
      {
        Component: ProtectedLayout,
        children: [
          {
            path: "/dashboard",
            Component: Dashboard,
          },
          {
            path: "/creator/:id",
            Component: CreatorProfile,
          },
          {
            path: "/company/:id",
            Component: CompanyPublicProfile,
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
            path: "/conversations/:userId",
            Component: ConversationDetails,
          },
          {
            path: "/campaigns",
            Component: MyCampaigns,
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
            Component: Analytics,
          },
          {
            path: "/profile",
            Component: ProfileSettings,
          },
        ],
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
