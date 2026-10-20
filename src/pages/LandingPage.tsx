import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, BarChart3, FileJson, Layers, Zap, Globe, Lock } from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Live Risk Scores",
    desc: "Five-factor composite risk scoring across 50+ DeFi protocols, powered by live DefiLlama data.",
  },
  {
    icon: FileJson,
    title: "On-chain Receipts",
    desc: "SHA-256 risk receipts anchored permanently on Arc Mainnet. Tamper-proof, verifiable forever.",
  },
  {
    icon: Layers,
    title: "Exit Stress Simulator",
    desc: "Model worst-case exit scenarios under liquidity crises, governance attacks, and smart contract exploits.",
  },
  {
    icon: Globe,
    title: "Arc Ecosystem",
    desc: "Deep dive into Arc Mainnet — chain stats, USDC gas economics, and native Arc DeFi protocols.",
  },
  {
    icon: Lock,
    title: "Premium Intelligence",
    desc: "Unlock full evidence registers, PDF receipts, and verified on-chain badges for 0.1 USDC.",
  },
  {
    icon: Zap,
    title: "AI Guide",
    desc: "Ask the built-in AI assistant about risk methodology, scores, and how ExitProof works.",
  },
];

const STATS = [
  { value: "50+", label: "Protocols tracked" },
  { value: "5", label: "Risk factors" },
  { value: "Arc", label: "Mainnet anchoring" },
  { value: "0.1 USDC", label: "Premium access" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-gradient)" }}>
      {/* Nav */}
      <header className="border-b border-white/8 bg-[#0d1b2f]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
              <Shield size={15} className="text-[var(--accent)]" />
            </div>
            <div>
              <span className="display font-bold text-[var(--ink)] text-base tracking-tight">ExitProof</span>
              <span className="hidden sm:block text-[10px] text-[var(--subtle)] -mt-0.5">DeFi Risk Intelligence</span>
            </div>
          </div>
          <button
            onClick={() => { void navigate("/dashboard"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all"
          >
            Launch App <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center gap-8">
          {/* Badge */}
          <div className="flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/25 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-xs text-[var(--accent)] font-semibold tracking-wide">Live on Arc Mainnet</span>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-4">
            <h1 className="display font-bold text-[var(--ink)] text-4xl sm:text-6xl leading-none tracking-tight">
              Know your DeFi risk
              <br />
              <span style={{ color: "var(--accent)" }}>before you exit.</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--muted)] max-w-xl text-pretty mx-auto leading-relaxed">
              ExitProof scores 50+ DeFi protocols across five risk dimensions, generates tamper-proof receipts, and anchors them permanently on Arc — where USDC is the gas token.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => { void navigate("/dashboard"); }}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[var(--accent)]/90 text-[var(--bg)] text-base font-bold hover:bg-[var(--accent)] transition-all active:scale-95 shadow-lg shadow-[var(--accent)]/20"
            >
              Enter ExitProof <ArrowRight size={16} />
            </button>
            <button
              onClick={() => { void navigate("/ecosystem"); }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/15 text-[var(--muted)] text-sm font-medium hover:border-white/25 hover:text-[var(--ink-2)] transition-all"
            >
              Explore Arc Ecosystem
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-4">
            {STATS.map(s => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/4 p-4 flex flex-col items-center gap-1">
                <span className="display font-bold text-[var(--ink)] text-2xl tabular-nums">{s.value}</span>
                <span className="text-[11px] text-[var(--subtle)]">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="display font-bold text-[var(--ink)] text-2xl sm:text-3xl tracking-tight mb-2">
              Everything you need to assess DeFi risk
            </h2>
            <p className="text-sm text-[var(--muted)]">Built on Arc — where USDC is the native gas token.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-3 hover:border-white/15 hover:bg-white/6 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/20 flex items-center justify-center">
                    <Icon size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="display font-semibold text-[var(--ink-2)] text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-white/6 py-16">
          <div className="max-w-2xl mx-auto px-6 text-center flex flex-col items-center gap-5">
            <h2 className="display font-bold text-[var(--ink)] text-2xl sm:text-3xl tracking-tight">
              Ready to assess your risk?
            </h2>
            <p className="text-sm text-[var(--muted)] text-pretty">
              Connect your wallet, pick a protocol, and generate an on-chain verified risk receipt in under 60 seconds.
            </p>
            <button
              onClick={() => { void navigate("/dashboard"); }}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[var(--accent)]/90 text-[var(--bg)] text-base font-bold hover:bg-[var(--accent)] transition-all active:scale-95 shadow-lg shadow-[var(--accent)]/20"
            >
              Enter ExitProof <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-[10px] text-[var(--subtle)]">
          ExitProof · Smart contract on{" "}
          <a href="https://explorer.arc.io/address/0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
            Arc Mainnet
          </a>{" "}
          · Not financial advice
        </p>
      </footer>
    </div>
  );
}
