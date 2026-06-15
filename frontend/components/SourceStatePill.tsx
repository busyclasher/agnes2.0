import type {SourceState} from "@/lib/types";

export function SourceStatePill({state}: {state: SourceState}) {
  if (state === "live") return null;
  const labels: Record<Exclude<SourceState, "live">, string> = {
    cache: "Cached result",
    sample: "Demo sample",
    fallback: "Fallback result",
  };
  return (
    <span className="source-pill" role="status">
      {labels[state]}
    </span>
  );
}
