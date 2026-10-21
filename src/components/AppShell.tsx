import { useNavigate, useLocation } from "react-router-dom";
import { Shield, BarChart3, Globe, GitCompare, Activity, Wallet } from "lucide-react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { AIAssistant } from "./AIAssistant";

const NAV = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/compare", label: "Compare", icon: GitCompare },
  { path: "/wallet", label: "Wallet Risk", icon: Wallet },
  { path: "/ecosystem", label: "Arc Ecosystem", icon: Globe },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, chainId } = useAccount();

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-gradient)" }}>
      {/* Top nav */}
      <header className="border-b border-white/8 bg-[#0d1b2f]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <button
            onClick={() => { void navigate("/"); }}
            className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
              <Shield size={15} className="text-[var(--accent)]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="display font-bold text-[var(--ink)] text-sm tracking-tight">ExitProof</span>
              <span className="text-[9px] text-[var(--subtle)] hidden sm:block">DeFi Risk Intelligence</span>
            </div>
          </button>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path || (path === "/dashboard" && location.pathname.startsWith("/protocol"));
              return (
                <button
                  key={path}
                  onClick={() => { void navigate(path); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/25"
                      : "text-[var(--subtle)] hover:text-[var(--muted)] hover:bg-white/5"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Right: network badge + wallet */}
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className={`hidden sm:flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-semibold ${
                chainId === 5042
                  ? "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]"
                  : chainId === 5042002
                  ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                  : "bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--danger)]"
              }`}>
                <Activity size={8} />
                {chainId === 5042 ? "Arc Mainnet" : chainId === 5042002 ? "Arc Testnet" : "Wrong network"}
              </span>
            )}
            <ConnectKitButton />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-white/6 flex gap-1 px-4 py-2">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => { void navigate(path); }}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  active ? "text-[var(--accent)] bg-[var(--accent)]/10" : "text-[var(--subtle)]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* AI Assistant floating button */}
      <AIAssistant />
    </div>
  );
}
