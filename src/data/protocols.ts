export type FactorScores = {
  contractControls: number;
  liquidity: number;
  concentration: number;
  governance: number;
  history: number;
};

export type EvidenceItem = {
  factor: keyof FactorScores;
  label: string;
  type: "onchain" | "verified-source" | "claim" | "missing";
  detail: string;
  staleDays?: number;
};

export type Protocol = {
  id: string;
  name: string;
  category: string;
  tvl: string;
  chain: string;
  scores: FactorScores;
  evidence: EvidenceItem[];
  description: string;
  warnings: string[];
  lastChecked: string; // ISO date string
};

export const WEIGHTS: FactorScores = {
  contractControls: 0.25,
  liquidity: 0.25,
  concentration: 0.15,
  governance: 0.15,
  history: 0.20,
};

export function computeComposite(scores: FactorScores): number {
  return Math.round(
    scores.contractControls * WEIGHTS.contractControls +
    scores.liquidity * WEIGHTS.liquidity +
    scores.concentration * WEIGHTS.concentration +
    scores.governance * WEIGHTS.governance +
    scores.history * WEIGHTS.history
  );
}

export function riskLabel(score: number): { label: string; color: string } {
  if (score < 25) return { label: "Lower Observed Risk", color: "text-[var(--success)]" };
  if (score < 45) return { label: "Moderate Risk", color: "text-yellow-400" };
  if (score < 70) return { label: "Elevated Risk", color: "text-orange-400" };
  return { label: "High Risk", color: "text-[var(--danger)]" };
}

export function evidenceCoverage(evidence: EvidenceItem[]): number {
  const factors: (keyof FactorScores)[] = [
    "contractControls", "liquidity", "concentration", "governance", "history"
  ];
  const covered = factors.filter(f =>
    evidence.some(e => e.factor === f && e.type !== "missing")
  );
  return Math.round((covered.length / factors.length) * 100);
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "stableswap-v2",
    name: "StableSwap V2",
    category: "AMM / Stablecoin Pool",
    tvl: "$142M",
    chain: "Arc Testnet",
    lastChecked: "2026-10-18",
    description:
      "A two-pool stablecoin AMM with admin-upgradeable logic. High TVL but several centralization controls remain active.",
    warnings: [
      "Admin key can pause all withdrawals without timelock.",
      "Source code verified but upgrade proxy not announced.",
    ],
    scores: {
      contractControls: 72,
      liquidity: 38,
      concentration: 55,
      governance: 68,
      history: 30,
    },
    evidence: [
      {
        factor: "contractControls",
        label: "Upgrade proxy",
        type: "onchain",
        detail: "Transparent proxy pattern confirmed on-chain. No timelock on admin.",
        staleDays: 2,
      },
      {
        factor: "contractControls",
        label: "Pause function",
        type: "verified-source",
        detail: "pauseAll() callable by owner with no delay.",
        staleDays: 2,
      },
      {
        factor: "liquidity",
        label: "Pool depth",
        type: "onchain",
        detail: "$142M TVL across two stablecoin pairs.",
        staleDays: 1,
      },
      {
        factor: "liquidity",
        label: "Withdrawal queue",
        type: "missing",
        detail: "No documented withdrawal limit or queue data found.",
      },
      {
        factor: "concentration",
        label: "LP token distribution",
        type: "onchain",
        detail: "Top 3 LPs hold ~61% of pool shares.",
        staleDays: 3,
      },
      {
        factor: "governance",
        label: "Timelock",
        type: "verified-source",
        detail: "No governance timelock found in current deployment.",
        staleDays: 2,
      },
      {
        factor: "history",
        label: "Incidents",
        type: "claim",
        detail: "Team claims zero exploits since launch 14 months ago. No independent corroboration found.",
        staleDays: 30,
      },
    ],
  },
  {
    id: "lending-arc",
    name: "LendingArc",
    category: "Lending Protocol",
    tvl: "$87M",
    chain: "Arc Testnet",
    lastChecked: "2026-10-17",
    description:
      "An over-collateralised lending market with liquidation bots. Governance uses a 48-hour timelock. Source code fully verified.",
    warnings: [
      "Oracle uses a single price source; no fallback documented.",
      "Emergency shutdown callable by two-of-five multisig.",
    ],
    scores: {
      contractControls: 41,
      liquidity: 50,
      concentration: 35,
      governance: 38,
      history: 25,
    },
    evidence: [
      {
        factor: "contractControls",
        label: "Source verification",
        type: "verified-source",
        detail: "All contracts verified. No upgrade proxy present.",
        staleDays: 5,
      },
      {
        factor: "liquidity",
        label: "Utilisation rate",
        type: "onchain",
        detail: "Current utilisation 68%. Remaining withdrawable: ~$27.8M.",
        staleDays: 1,
      },
      {
        factor: "concentration",
        label: "Whale deposits",
        type: "onchain",
        detail: "Largest single depositor holds 18% of pool.",
        staleDays: 2,
      },
      {
        factor: "governance",
        label: "Timelock",
        type: "verified-source",
        detail: "48-hour timelock on all parameter changes.",
        staleDays: 5,
      },
      {
        factor: "governance",
        label: "Multisig composition",
        type: "claim",
        detail: "2-of-5 multisig; signer identities unverified by ExitProof.",
        staleDays: 14,
      },
      {
        factor: "history",
        label: "Audit history",
        type: "claim",
        detail: "One third-party audit published. Findings resolved per team post.",
        staleDays: 60,
      },
      {
        factor: "history",
        label: "Incident record",
        type: "onchain",
        detail: "No on-chain emergency events detected in 10 months.",
        staleDays: 1,
      },
    ],
  },
  {
    id: "yieldvault-x",
    name: "YieldVault-X",
    category: "Yield Aggregator",
    tvl: "$23M",
    chain: "Arc Testnet",
    lastChecked: "2026-10-15",
    description:
      "An auto-compounding vault with unverified strategy contracts. High concentration among early depositors.",
    warnings: [
      "Strategy contract source not publicly verified.",
      "Top depositor holds 38% of vault shares.",
      "No incident history available — treated as 100 per methodology.",
    ],
    scores: {
      contractControls: 88,
      liquidity: 62,
      concentration: 80,
      governance: 100,
      history: 100,
    },
    evidence: [
      {
        factor: "contractControls",
        label: "Strategy source",
        type: "missing",
        detail: "Strategy contract not verified on-chain. Cannot assess controls.",
      },
      {
        factor: "liquidity",
        label: "Withdrawal delay",
        type: "claim",
        detail: "Team claims instant withdrawals. No on-chain queue check performed.",
        staleDays: 21,
      },
      {
        factor: "concentration",
        label: "Top depositor",
        type: "onchain",
        detail: "Single address holds 38% of vault shares.",
        staleDays: 2,
      },
      {
        factor: "governance",
        label: "Governance docs",
        type: "missing",
        detail: "No governance documentation or on-chain governance found.",
      },
      {
        factor: "history",
        label: "Incident record",
        type: "missing",
        detail: "No incident history available. Score treated as 100 per methodology.",
      },
    ],
  },
];
