/**
 * DefiLlama integration — fetches top protocols and maps them to the
 * internal Protocol shape used throughout ExitProof.
 *
 * Risk scores are algorithmically derived from signals available in the
 * DefiLlama API (audits count, age, category, chain count, TVL).
 * They are NOT a security audit and are labelled as such in the UI.
 */

import type { Protocol, EvidenceItem, FactorScores } from "../data/protocols";

// ----- DefiLlama API shape (subset we use) --------------------------------

interface LlamaProtocol {
  id: string;
  name: string;
  slug: string;
  category: string;
  chain: string;          // dominant chain label
  chains: string[];
  tvl: number;
  audits: string;         // "0" | "1" | "2" | "3" (string from API)
  listedAt: number;       // unix timestamp
  description: string;
  twitter?: string;
  logo?: string;
}

const LLAMA_API = "https://api.llama.fi/protocols";
const TOP_N = 100; // fetch top N by TVL, then pick a diverse slice

// ----- Score derivation ---------------------------------------------------

/**
 * Derive a 0–100 risk score per factor from DefiLlama signals.
 * Higher = higher observed risk.
 */
function deriveScores(p: LlamaProtocol): FactorScores {
  // contractControls — proxy for audit rigour
  // 0 audits → 85, 1 → 60, 2 → 40, 3+ → 20
  const auditCount = parseInt(p.audits ?? "0", 10) || 0;
  const contractControls = auditCount === 0 ? 85 : auditCount === 1 ? 60 : auditCount === 2 ? 40 : 20;

  // liquidity — based on TVL tier (higher TVL → lower liquidity risk)
  let liquidity = 70;
  if (p.tvl > 1_000_000_000) liquidity = 20;
  else if (p.tvl > 500_000_000) liquidity = 30;
  else if (p.tvl > 100_000_000) liquidity = 45;
  else if (p.tvl > 10_000_000) liquidity = 60;

  // concentration — number of chains (more chains → more dispersed)
  const chainCount = p.chains?.length ?? 1;
  const concentration = chainCount >= 5 ? 25 : chainCount >= 3 ? 40 : chainCount === 2 ? 55 : 70;

  // governance — category proxy
  const cat = (p.category ?? "").toLowerCase();
  let governance = 65;
  if (cat.includes("dex") || cat.includes("amm")) governance = 45;
  if (cat.includes("lending")) governance = 50;
  if (cat.includes("bridge")) governance = 75;
  if (cat.includes("cex")) governance = 90;

  // history — age of protocol (older → more battle-tested → lower risk)
  const ageMonths = p.listedAt
    ? (Date.now() / 1000 - p.listedAt) / (60 * 60 * 24 * 30)
    : 0;
  let history = 80;
  if (ageMonths > 36) history = 20;
  else if (ageMonths > 24) history = 30;
  else if (ageMonths > 12) history = 45;
  else if (ageMonths > 6) history = 60;

  return { contractControls, liquidity, concentration, governance, history };
}

function deriveEvidence(p: LlamaProtocol): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const auditCount = parseInt(p.audits ?? "0", 10) || 0;

  // contractControls
  items.push({
    factor: "contractControls",
    label: "Audit count",
    type: auditCount >= 2 ? "verified-source" : auditCount === 1 ? "claim" : "missing",
    detail:
      auditCount === 0
        ? "No audits listed on DefiLlama."
        : `${auditCount} audit(s) listed on DefiLlama. Individual reports not verified by ExitProof.`,
  });

  // liquidity
  const tvlFormatted = formatTvl(p.tvl);
  items.push({
    factor: "liquidity",
    label: "TVL (DefiLlama)",
    type: "onchain",
    detail: `${tvlFormatted} total value locked as reported by DefiLlama.`,
    staleDays: 1,
  });

  // concentration
  items.push({
    factor: "concentration",
    label: "Chain distribution",
    type: "onchain",
    detail: `Deployed on ${p.chains?.length ?? 1} chain(s): ${(p.chains ?? [p.chain]).slice(0, 5).join(", ")}.`,
    staleDays: 1,
  });

  // governance
  items.push({
    factor: "governance",
    label: "Protocol category",
    type: "claim",
    detail: `Category: ${p.category}. Governance model inferred from category; not independently verified.`,
    staleDays: 7,
  });

  // history
  const ageMonths = p.listedAt
    ? Math.round((Date.now() / 1000 - p.listedAt) / (60 * 60 * 24 * 30))
    : 0;
  items.push({
    factor: "history",
    label: "Protocol age",
    type: p.listedAt ? "onchain" : "missing",
    detail: p.listedAt
      ? `Listed on DefiLlama ~${ageMonths} month(s) ago.`
      : "Listing date unavailable.",
    staleDays: 30,
  });

  return items;
}

function deriveWarnings(p: LlamaProtocol): string[] {
  const warnings: string[] = [];
  const auditCount = parseInt(p.audits ?? "0", 10) || 0;
  if (auditCount === 0) warnings.push("No audits listed on DefiLlama for this protocol.");
  if (p.tvl < 5_000_000) warnings.push("TVL below $5M — limited liquidity buffer.");
  const cat = (p.category ?? "").toLowerCase();
  if (cat.includes("bridge")) warnings.push("Bridge protocols carry elevated cross-chain custody risk.");
  if (cat.includes("cex")) warnings.push("Centralised exchange — counterparty risk applies.");
  return warnings;
}

function formatTvl(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(0)}M`;
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`;
  return `$${tvl.toFixed(0)}`;
}

function llamaToProtocol(p: LlamaProtocol): Protocol {
  const scores = deriveScores(p);
  return {
    id: p.slug ?? p.id,
    name: p.name,
    category: p.category ?? "Unknown",
    tvl: formatTvl(p.tvl),
    chain: p.chain ?? "Multi-Chain",
    scores,
    evidence: deriveEvidence(p),
    description:
      p.description?.slice(0, 280) ||
      `${p.name} is a ${p.category ?? "DeFi"} protocol. Risk scores are algorithmically derived from DefiLlama signals.`,
    warnings: deriveWarnings(p),
    lastChecked: new Date().toISOString().slice(0, 10),
  };
}

// ----- Public API ---------------------------------------------------------

export interface DefiLlamaResult {
  protocols: Protocol[];
  fetchedAt: Date;
  source: "live" | "fallback";
  error?: string;
}

export async function fetchTopProtocols(count = 50): Promise<DefiLlamaResult> {
  try {
    const res = await fetch(LLAMA_API, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`DefiLlama returned ${res.status}`);
    const all = (await res.json()) as unknown as LlamaProtocol[];

    // Filter: must have TVL > $1M, a known category, not a CEX or Chain
    const filtered = all
      .filter(
        (p) =>
          p.tvl > 1_000_000 &&
          p.category &&
          !["CEX", "Chain", "RWA"].includes(p.category) &&
          p.name &&
          p.slug
      )
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, TOP_N);

    // Pick a diverse slice: vary by category
    const seen = new Set<string>();
    const diverse: LlamaProtocol[] = [];
    for (const p of filtered) {
      if (diverse.length >= count) break;
      const key = p.category;
      if (!seen.has(key) || diverse.length < count) {
        diverse.push(p);
        seen.add(key);
      }
    }
    // fill up to count if diversity pass was too restrictive
    for (const p of filtered) {
      if (diverse.length >= count) break;
      if (!diverse.includes(p)) diverse.push(p);
    }

    const protocols = diverse.slice(0, count).map(llamaToProtocol);
    return { protocols, fetchedAt: new Date(), source: "live" };
  } catch (err) {
    return {
      protocols: [],
      fetchedAt: new Date(),
      source: "fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
