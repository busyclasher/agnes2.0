import type {RiskLevel} from "@/lib/types";

const SYMBOLS: Record<RiskLevel, string> = {
  red: "!",
  yellow: "!",
  green: "i",
  unknown: "?",
};

export function RiskBadge({
  level,
  label,
}: {
  level: RiskLevel;
  label: string;
}) {
  return (
    <div className={`risk-badge risk-${level}`} data-testid="risk-badge">
      <span className="risk-symbol" aria-hidden="true">
        {SYMBOLS[level]}
      </span>
      <span>
        <small>Risk level</small>
        <strong>{label}</strong>
      </span>
    </div>
  );
}
