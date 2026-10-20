import type { Protocol, FactorScores } from "../data/protocols";
import { computeComposite, evidenceCoverage, WEIGHTS } from "../data/protocols";

export type RiskReceipt = {
  version: "exitproof-v1";
  generatedAt: string;
  protocol: {
    id: string;
    name: string;
    category: string;
    chain: string;
    tvl: string;
  };
  scores: FactorScores;
  composite: number;
  weights: FactorScores;
  evidenceCoverage: number;
  evidence: Protocol["evidence"];
  warnings: string[];
  methodology: string;
  limitations: string[];
  disclaimer: string;
};

export function buildReceipt(protocol: Protocol): RiskReceipt {
  return {
    version: "exitproof-v1",
    generatedAt: new Date().toISOString(),
    protocol: {
      id: protocol.id,
      name: protocol.name,
      category: protocol.category,
      chain: protocol.chain,
      tvl: protocol.tvl,
    },
    scores: protocol.scores,
    composite: computeComposite(protocol.scores),
    weights: WEIGHTS,
    evidenceCoverage: evidenceCoverage(protocol.evidence),
    evidence: protocol.evidence,
    warnings: protocol.warnings,
    methodology:
      "Composite = (ContractControls × 0.25) + (Liquidity × 0.25) + (Concentration × 0.15) + (Governance × 0.15) + (History × 0.20). Scores 0–100; higher = higher estimated risk. Missing evidence treated as 100.",
    limitations: [
      "All protocol metrics are illustrative — no live blockchain data connected.",
      "Exit model is illustrative and does not model a specific AMM, invariant, or queue.",
      "This is not a security audit or financial advice.",
      "On-chain anchoring is not implemented in this build.",
    ],
    disclaimer:
      "ExitProof is a research prototype. Never claim that a protocol is safe based on a single number. This receipt does not constitute investment advice.",
  };
}

export function downloadReceipt(receipt: RiskReceipt): void {
  const json = JSON.stringify(receipt, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `exitproof-receipt-${receipt.protocol.id}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function hashReceipt(receipt: RiskReceipt): Promise<string> {
  const json = JSON.stringify(receipt);
  const encoded = new TextEncoder().encode(json);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
