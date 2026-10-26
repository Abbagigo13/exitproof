import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
}

// ── Knowledge base ────────────────────────────────────────────────────────────
// A rule-based responder — no external API required.

const KB: Array<{ patterns: string[]; answer: string }> = [
  {
    patterns: ["what is exitproof", "what does exitproof do", "what is this app", "explain the app", "how does exitproof work"],
    answer:
      "ExitProof is a DeFi risk intelligence platform. It scores 50+ DeFi protocols across five risk factors using live data from DefiLlama, lets you simulate exit scenarios under stress, generates tamper-proof JSON risk receipts, and anchors their SHA-256 hashes permanently on Arc Mainnet.",
  },
  {
    patterns: ["risk score", "how is the score", "how are scores calculated", "what does the score mean", "composite score"],
    answer:
      "The composite risk score is a weighted average of five factors:\n• Contract Controls (25%) — audit quality, upgradeability, admin keys\n• Liquidity & Exits (25%) — pool depth, exit routes, slippage risk\n• Holder Concentration (15%) — whale concentration, token distribution\n• Governance (15%) — multisig setup, timelock, DAO structure\n• Protocol History (20%) — age, past exploits, track record\n\nScores run 0–100. Higher = higher estimated risk. Missing evidence is treated as 100 until verified.",
  },
  {
    patterns: ["factor", "contract controls", "liquidity", "concentration", "governance", "history"],
    answer:
      "The five risk factors are:\n1. Contract Controls — is the code audited? Can it be upgraded without a timelock? Are admin keys multisig?\n2. Liquidity & Exits — can you exit large positions without major slippage? Is liquidity deep and stable?\n3. Holder Concentration — are whale wallets holding a large share? Can a single actor dump the market?\n4. Governance — is there a timelock on changes? Is the DAO active and decentralised?\n5. Protocol History — how old is it? Has it been exploited? What is its track record under stress?",
  },
  {
    patterns: ["receipt", "risk receipt", "what is a receipt", "json receipt", "export receipt"],
    answer:
      "A risk receipt is a JSON document that captures a point-in-time snapshot of a protocol's risk assessment. It includes all five factor scores, the composite score, every evidence item with freshness flags, warnings, the scoring methodology, and limitations. You can export it as a JSON file or compute its SHA-256 hash to anchor it on-chain.",
  },
  {
    patterns: ["anchor", "on-chain", "hash", "sha-256", "blockchain proof"],
    answer:
      "Once you compute a receipt's SHA-256 hash in the Receipt tab, you can anchor it on Arc Mainnet by clicking 'Anchor this hash'. This calls the RiskReceiptRegistry contract, which stores the hash, your wallet address, and a timestamp permanently on-chain. Anyone can verify later that the receipt content matches the anchored hash — proof the data hasn't been tampered with.",
  },
  {
    patterns: ["verify", "verify receipt", "how to verify", "check hash"],
    answer:
      "Go to the Verify tab for any protocol, paste a SHA-256 hash (0x-prefixed, 64 hex chars), and click 'Verify on-chain'. ExitProof calls getReceipt() on the RiskReceiptRegistry contract and shows who anchored it, when, and what protocol it references. A revoked receipt shows a red REVOKED badge.",
  },
  {
    patterns: ["premium", "0.1 usdc", "pay", "unlock", "evidence", "gated"],
    answer:
      "Some features are gated behind a 0.1 USDC payment per protocol per wallet. Paying unlocks: the full evidence register (beyond the first 2 items), PDF/JSON receipt export, and a verified on-chain receipt badge. The payment is a direct USDC transfer on Arc Mainnet. Access is stored in your browser for this wallet.",
  },
  {
    patterns: ["arc", "arc mainnet", "arc chain", "usdc gas", "gas token"],
    answer:
      "Arc is Circle's EVM-compatible blockchain where USDC is the native gas token — you never need ETH. It has sub-second finality (~500ms blocks), stable fees in dollar terms, and native support for CCTP, Gateway, and Circle's Bridge Kit. ExitProof anchors receipts on Arc Mainnet so fees are paid directly in USDC.",
  },
  {
    patterns: ["exit stress", "stress test", "simulate exit", "exit simulator"],
    answer:
      "The Exit Stress simulator models what happens to your position under three crisis scenarios: liquidity crisis (pool drains to 20%), governance attack (protocol paused or parameters changed), and smart contract exploit (emergency withdraw, funds at risk). It estimates exit slippage, time-to-exit, and risk level for each scenario.",
  },
  {
    patterns: ["what-if", "what if lab", "scenario", "modify", "adjust"],
    answer:
      "The What-If Lab lets you adjust individual factor scores manually and see how the composite score changes. Move any slider to model a hypothetical improvement (e.g. 'what if this protocol got a new audit?') and see the new risk level and composite score in real time.",
  },
  {
    patterns: ["compare", "comparison", "compare protocols", "side by side"],
    answer:
      "The Comparison page shows two protocols side-by-side. Each column displays the composite gauge, all five factor bars, warnings, and quick stats. Use the selectors at the top to pick any two protocols from the live DefiLlama data.",
  },
  {
    patterns: ["defillama", "data source", "where does data come from", "live data"],
    answer:
      "Protocol data (TVL, category, chain, age) is fetched live from the DefiLlama public API on every page load. Risk scores are derived algorithmically from available signals: audit count, TVL tier, chain concentration, category risk profile, and protocol age. There is no manual curation — scores update automatically as on-chain data changes.",
  },
  {
    patterns: ["not financial advice", "disclaimer", "accuracy", "how accurate"],
    answer:
      "ExitProof's risk scores are algorithmic estimates based on publicly available data. They are NOT a security audit, investment advice, or a guarantee of safety. Missing evidence is treated conservatively (score = 100) but this does not prove a protocol is unsafe. Always do your own research before committing funds.",
  },
  {
    patterns: ["share", "shareable", "link", "share receipt", "share protocol"],
    answer:
      "Every protocol has a Share button in the breadcrumb that copies a direct URL (?protocol=<id>). The Receipt tab has a 'Share snapshot' button that encodes the full receipt data into a base64 URL — anyone with the link sees a read-only snapshot card with the risk scores and SHA-256 hash, with no server required.",
  },
  {
    patterns: ["wallet risk", "wallet score", "portfolio risk", "arc wallet", "analyze wallet"],
    answer:
      "The Wallet Risk page (in the nav) lets you paste any Arc Mainnet address and instantly see:\n• USDC balance — read directly from the Arc RPC\n• Transaction count — from eth_getTransactionCount\n• Portfolio risk score — weighted by USDC transfer volume to known DeFi contracts\n• Receipt anchor count — how many risk receipts that wallet has anchored on-chain\n\nArc is a new chain so the DeFi contract registry is small — the balance and tx count are always accurate even if no DeFi interactions are mapped.",
  },
  {
    patterns: ["yield risk", "usdc yield", "yield dashboard", "risk-adjusted yield", "safe yield"],
    answer:
      "The Yield Risk page ranks all 50 protocols by risk-adjusted USDC yield. It estimates a gross APY by category (e.g. Lending ~8%, DEX ~12%), then scales it down by the composite risk score so higher-risk protocols show a lower adjusted yield. You can sort by adjusted yield, yield-to-risk ratio (bang for buck), safety (lowest risk first), TVL, or name. No token price conversion — everything is in USDC terms.",
  },
  {
    patterns: ["watchlist", "watch protocol", "alert", "threshold", "usdc signal"],
    answer:
      "The Watchlist page lets you bookmark protocols and set a risk-score threshold (drag the slider). When the score crosses your threshold, a red ALERT badge fires. Connected wallets can also send a 0.001 USDC on-chain self-signal — a pay-to-alert pattern that only works on Arc because gas is USDC. The signal lands permanently on-chain as proof of the alert moment.",
  },
  {
    patterns: ["my receipts", "my anchors", "my nfts", "receipt history", "view receipts"],
    answer:
      "The My Receipts page shows everything you have anchored on Arc Mainnet. Connect your wallet and it reads your receipt hashes directly from the RiskReceiptRegistry contract using getReceiptsByAnchorer(), then fetches each receipt's metadata. It also shows any Receipt NFTs you have minted. Everything is read from Arc — no server, no database.",
  },
  {
    patterns: ["nft", "mint nft", "receipt nft", "eprx", "nft metadata"],
    answer:
      "After computing a receipt hash in the Receipt tab, you can mint it as an ERC-721 NFT on Arc Mainnet. The ReceiptNFT contract stores all metadata fully on-chain as a base64-encoded JSON data URI — no IPFS, no server needed. The token includes the protocol name, risk score, risk level, and receipt hash as attributes. Contract: 0xf107Eb78AC34a4D51493425Af7473d1B29c9053C on Arc Mainnet.",
  },
  {
    patterns: ["block counter", "block number", "live block", "finality", "blocks per second"],
    answer:
      "The Arc Ecosystem page shows a live block counter that updates every 500ms — you can watch Arc Mainnet blocks tick up in real time. This directly demonstrates Arc's sub-second finality (~2 blocks per second). The counter reads eth_blockNumber directly from the Arc RPC with no middleman.",
  },
  {
    patterns: ["ecosystem", "arc ecosystem page", "arc stats", "arc tvl", "arc protocols"],
    answer:
      "The Arc Ecosystem page shows: live Arc chain TVL from DefiLlama, block time, gas fee, and a list of protocols deployed on Arc. It also has a Live Receipt Feed that polls the RiskReceiptRegistry for ReceiptAnchored events every 10 seconds — showing who anchored what, when. At the top, a live block counter shows Arc's sub-second finality in real time.",
  },
  {
    patterns: ["compare", "comparison page", "compare protocols", "side by side"],
    answer:
      "The Compare page shows two protocols side-by-side. Pick any two from the dropdowns — each column shows the composite risk gauge, all five factor bars with weights, warnings, and key stats. Great for deciding between two protocols before deploying capital.",
  },
  {
    patterns: ["hello", "hi", "hey", "help", "what can you do"],
    answer:
      "Hi! I'm ExitProof's AI guide. I can explain:\n• Risk scores and the five factors\n• Risk receipts and on-chain anchoring\n• Exit Stress simulator and What-If Lab\n• Arc Mainnet, USDC gas, and the live block counter\n• Wallet Risk Score and portfolio analysis\n• Yield Risk dashboard\n• Watchlist and USDC alerts\n• My Receipts page\n• Receipt NFT minting\n• Premium features\n\nJust ask!",
  },
];

function findAnswer(input: string): string {
  const q = input.toLowerCase().trim();
  for (const entry of KB) {
    if (entry.patterns.some(p => q.includes(p))) {
      return entry.answer;
    }
  }
  return "I'm not sure about that specific question. Try asking about risk scores, receipts, on-chain anchoring, Arc Mainnet, exit stress simulation, or the premium features. You can also ask 'what can you do?' for a full list of topics.";
}

// ── Component ─────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "How are risk scores calculated?",
  "What is a risk receipt?",
  "How does Arc Mainnet work?",
  "What is the Wallet Risk Score?",
  "What does the Yield Risk page show?",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi! I'm ExitProof's AI guide. Ask me anything about risk scores, receipts, Arc Mainnet, or how the app works." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    // Simulate a short thinking delay for realism
    setTimeout(() => {
      const answer = findAnswer(text);
      setMessages(prev => [...prev, { role: "ai", text: answer }]);
      setTyping(false);
    }, 420);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {/* Floating button — sits above the Arc Studio watermark (~48px tall at bottom) */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed rounded-2xl bg-[var(--accent)]/90 border border-[var(--accent)] shadow-xl shadow-[var(--accent)]/25 flex items-center justify-center hover:bg-[var(--accent)] transition-all active:scale-95"
        style={{ width: 52, height: 52, zIndex: 10001, bottom: "4.5rem", right: "1.25rem" }}
        aria-label="Open AI assistant"
      >
        {open ? <ChevronDown size={20} className="text-[var(--bg)]" /> : <Sparkles size={20} className="text-[var(--bg)]" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-[#0d1b2f]/96 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "70vh", zIndex: 10001, bottom: "8rem", right: "1.25rem" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
                <Sparkles size={13} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)] leading-none">ExitProof AI</p>
                <p className="text-[9px] text-[var(--subtle)]">Ask about the app</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-[var(--subtle)] hover:text-[var(--muted)] transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[var(--accent)]/20 text-[var(--ink-2)] rounded-br-sm"
                    : "bg-white/6 border border-white/8 text-[var(--muted)] rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white/6 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only if one message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[10px] text-[var(--accent)] border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-2.5 py-1 rounded-lg hover:bg-[var(--accent)]/15 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 pb-3 pt-2 border-t border-white/8 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about risk scores, receipts…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[var(--ink-2)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center hover:bg-[var(--accent)]/25 transition-all disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
