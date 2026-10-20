import { Zap } from "lucide-react";
import type { Protocol } from "../data/protocols";
import { computeComposite, riskLabel } from "../data/protocols";

type Scenario = {
  id: string;
  label: string;
  description: string;
  delta: Partial<Record<keyof Protocol["scores"], number>>;
  additionalWarning: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "admin-key",
    label: "Admin key compromised",
    description: "Attacker gains control of the upgrade or pause key.",
    delta: { contractControls: 40, governance: 30 },
    additionalWarning: "All funds potentially at risk if pause or drain functions exist.",
  },
  {
    id: "liquidity-drop",
    label: "40% liquidity withdrawal",
    description: "A large LP or institutional player exits the pool.",
    delta: { liquidity: 35, concentration: 15 },
    additionalWarning: "Remaining liquidity depth drops sharply; exit costs increase.",
  },
  {
    id: "whale-dump",
    label: "Largest holder sells",
    description: "The top token holder sells their full position.",
    delta: { concentration: 40, liquidity: 20 },
    additionalWarning: "Token price and pool depth both affected. Cascade sells possible.",
  },
  {
    id: "oracle-failure",
    label: "Oracle price manipulation",
    description: "Price oracle is manipulated by 10–30% from true value.",
    delta: { contractControls: 25, history: 20 },
    additionalWarning: "Liquidations may fire incorrectly; borrowers or lenders at risk.",
  },
  {
    id: "depeg",
    label: "Stablecoin loses peg",
    description: "A collateral or yield-bearing stablecoin depegs 8%.",
    delta: { liquidity: 45, concentration: 20, history: 15 },
    additionalWarning: "Pool imbalance, impermanent loss, and withdrawal queues likely.",
  },
];

type Props = {
  protocol: Protocol;
};

export function WhatIfLab({ protocol }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {SCENARIOS.map(scenario => {
        const stressed = { ...protocol.scores };
        for (const [k, delta] of Object.entries(scenario.delta)) {
          const key = k as keyof Protocol["scores"];
          stressed[key] = Math.min(100, stressed[key] + (delta));
        }
        const baseLine = computeComposite(protocol.scores);
        const stressedLine = computeComposite(stressed);
        const diff = stressedLine - baseLine;
        const { label, color } = riskLabel(stressedLine);

        return (
          <div
            key={scenario.id}
            className="rounded-xl border border-white/8 bg-white/4 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap size={13} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold text-[var(--ink-2)]">
                    {scenario.label}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] text-pretty">
                  {scenario.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-baseline gap-1 tabular-nums justify-end">
                  <span className="text-[var(--subtle)] text-xs">{baseLine}</span>
                  <span className="text-[var(--subtle)] text-xs">→</span>
                  <span className={`text-base font-bold display ${color}`}>
                    {stressedLine}
                  </span>
                </div>
                <div className={`text-[10px] font-medium ${color}`}>
                  +{diff} pts · {label}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-orange-400/20 bg-orange-400/5 px-3 py-2">
              <p className="text-xs text-orange-300">{scenario.additionalWarning}</p>
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-[var(--subtle)] text-center px-2">
        Scenarios are illustrative assumptions, not predictions. Dependencies between factors are not modelled.
      </p>
    </div>
  );
}
