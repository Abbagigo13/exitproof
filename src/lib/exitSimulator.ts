/**
 * Illustrative exit stress model.
 *
 * This is NOT a real AMM formula, a real price quote, or a trading recommendation.
 * It uses a simplified curve to illustrate potential slippage under stress.
 * A production implementation must use source-attributed liquidity data,
 * venue-specific pool invariants, and proper validation.
 */

export type ExitScenario = {
  amount: number;
  liquidityRatio: number; // amount / pool TVL
  slippage: number; // percentage
  priceImpact: number; // percentage
  exitability: "easy" | "moderate" | "difficult" | "critical";
  assumptions: string[];
  cannotVerify: string[];
};

function illustrativeImpact(ratio: number): number {
  // Simplified curve: near-zero at small ratios, accelerating as ratio approaches 1
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 75;
  // Quadratic approximation
  return Math.min(75, Math.round(ratio * ratio * 65 + ratio * 8));
}

export function simulateExit(amountUsd: number, tvlUsd: number, liquidityScore: number): ExitScenario {
  const effectiveLiquidity = tvlUsd * (1 - liquidityScore / 200); // stress-adjusted
  const ratio = amountUsd / Math.max(effectiveLiquidity, 1);
  const impact = illustrativeImpact(Math.min(ratio, 1));
  const slippage = Math.round(impact * 0.6 * 10) / 10;

  let exitability: ExitScenario["exitability"];
  if (impact < 5) exitability = "easy";
  else if (impact < 20) exitability = "moderate";
  else if (impact < 45) exitability = "difficult";
  else exitability = "critical";

  return {
    amount: amountUsd,
    liquidityRatio: Math.round(ratio * 10000) / 100,
    slippage,
    priceImpact: impact,
    exitability,
    assumptions: [
      "TVL treated as uniformly available liquidity.",
      "Single-route exit assumed. No multi-hop or split routing.",
      "No withdrawal queue, lock, or pause in effect.",
      "Gas fees excluded from impact estimate.",
      "Stress adjustment reduces effective liquidity by up to 50% based on liquidity score.",
    ],
    cannotVerify: [
      "Actual pool invariant (constant-product, StableSwap, etc.).",
      "Current on-chain depth and composition.",
      "Active withdrawal limits or cooldowns.",
      "MEV and sandwich attack exposure.",
    ],
  };
}

export const PRESET_AMOUNTS = [100, 1_000, 10_000, 100_000, 1_000_000];

export function parseTvl(tvlStr: string): number {
  const s = tvlStr.replace(/[$,]/g, "").trim();
  if (s.endsWith("B")) return parseFloat(s) * 1e9;
  if (s.endsWith("M")) return parseFloat(s) * 1e6;
  if (s.endsWith("K")) return parseFloat(s) * 1e3;
  return parseFloat(s) || 1e6;
}
