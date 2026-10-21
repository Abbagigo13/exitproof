import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ComparePage from "./pages/ComparePage";
import EcosystemPage from "./pages/EcosystemPage";
import WalletRiskPage from "./pages/WalletRiskPage";
import YieldRiskPage from "./pages/YieldRiskPage";
import WatchlistPage from "./pages/WatchlistPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/ecosystem" element={<EcosystemPage />} />
      <Route path="/wallet" element={<WalletRiskPage />} />
      <Route path="/yield" element={<YieldRiskPage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
