/**
 * GasPill — shows the estimated USDC gas cost for a transaction on Arc.
 * "Gas paid in USDC" is Arc's unique value prop — make it visible everywhere.
 */
import { Zap } from "lucide-react";

interface Props {
  display: string;
  loading: boolean;
  error?: string | null;
  className?: string;
}

export function GasPill({ display, loading, error, className = "" }: Props) {
  if (error) return null; // silently hide on estimation failure

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium text-[var(--subtle)] bg-white/4 border border-white/8 rounded-full px-2 py-0.5 ${className}`}
      title="Estimated Arc gas cost in USDC"
    >
      <Zap size={9} className="text-[var(--accent)] shrink-0" />
      {loading ? (
        <span className="opacity-50">estimating…</span>
      ) : (
        <span>{display} gas</span>
      )}
    </span>
  );
}
