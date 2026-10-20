import { riskLabel } from "../data/protocols";

type Props = {
  score: number;
  size?: "sm" | "md" | "lg";
};

export function RiskGauge({ score, size = "md" }: Props) {
  const { label, color } = riskLabel(score);

  const dim = size === "sm" ? 80 : size === "lg" ? 140 : 110;
  const strokeWidth = size === "sm" ? 7 : 10;
  const r = (dim - strokeWidth) / 2;
  const cx = dim / 2;
  const cy = dim / 2;

  // Arc from -215deg to +35deg (250deg sweep) centered at bottom
  const startAngle = -215;
  const sweepTotal = 250;
  const endAngle = startAngle + (score / 100) * sweepTotal;

  function polarToXY(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  const start = polarToXY(startAngle);
  const end = polarToXY(endAngle);
  const largeArc = (score / 100) * sweepTotal > 180 ? 1 : 0;

  const trackEnd = polarToXY(startAngle + sweepTotal);
  const trackLarge = 1;

  // Track path
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${trackLarge} 1 ${trackEnd.x} ${trackEnd.y}`;
  // Value path
  const valuePath =
    score > 0
      ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
      : "";

  const gaugeColor =
    score < 25
      ? "#8dd89f"
      : score < 45
      ? "#facc15"
      : score < 70
      ? "#fb923c"
      : "#e86d7a";

  const labelSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {valuePath && (
          <path
            d={valuePath}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "all 0.5s ease" }}
          />
        )}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={gaugeColor}
          fontSize={size === "sm" ? 18 : size === "lg" ? 36 : 28}
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight={700}
          letterSpacing="-1"
        >
          {score}
        </text>
      </svg>
      <span
        className={`${labelSize} font-semibold tracking-wide uppercase ${color}`}
        style={{ letterSpacing: "0.07em" }}
      >
        {label}
      </span>
    </div>
  );
}
