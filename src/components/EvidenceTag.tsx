import { CheckCircle, AlertTriangle, XCircle, Link } from "lucide-react";
import type { EvidenceItem } from "../data/protocols";

const typeConfig = {
  onchain: {
    label: "On-chain",
    icon: CheckCircle,
    bg: "bg-[var(--success)]/10",
    border: "border-[var(--success)]/30",
    text: "text-[var(--success)]",
  },
  "verified-source": {
    label: "Verified source",
    icon: Link,
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-300",
  },
  claim: {
    label: "Unverified claim",
    icon: AlertTriangle,
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
    text: "text-yellow-400",
  },
  missing: {
    label: "Missing",
    icon: XCircle,
    bg: "bg-[var(--danger)]/10",
    border: "border-[var(--danger)]/30",
    text: "text-[var(--danger)]",
  },
};

type Props = {
  item: EvidenceItem;
};

export function EvidenceTag({ item }: Props) {
  const cfg = typeConfig[item.type];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-2">
        <Icon size={14} className={`mt-0.5 shrink-0 ${cfg.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--ink-2)]">
              {item.label}
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border}`}
            >
              {cfg.label}
            </span>
            {item.staleDays !== undefined && item.staleDays > 14 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/10 border border-orange-400/30 text-orange-400 font-medium">
                STALE {item.staleDays}d
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 text-pretty">
            {item.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
