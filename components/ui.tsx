import { platformById } from "@/lib/platforms";
import type { PlatformId } from "@/lib/types";

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function PlatformDot({ id, withName = true }: { id: PlatformId; withName?: boolean }) {
  const p = platformById[id];
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
      {withName && p.name}
    </span>
  );
}

const verdictStyle = {
  good: "bg-good/15 text-good border-good/30",
  bad: "bg-bad/15 text-bad border-bad/30",
  ugly: "bg-ugly/15 text-ugly border-ugly/30",
} as const;

export function Verdict({ v }: { v: keyof typeof verdictStyle }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${verdictStyle[v]}`}>{v}</span>;
}
