import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { Dashboard } from "./components/Dashboard";
import { NewClaim } from "./components/NewClaim";
import { ClaimsHistory } from "./components/ClaimsHistory";
import { Analytics } from "./components/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "new-claim", Component: NewClaim },
      { path: "claims", Component: ClaimsHistory },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
