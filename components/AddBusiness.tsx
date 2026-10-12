"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";
import type { Business, PlatformId } from "@/lib/types";

/** Plug-and-play onboarding: anyone adds a business from the UI. Saved to localStorage (swap for DB in Phase 2). */
export default function AddBusiness({ onAdd, onClose }: { onAdd: (b: Business) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [platforms, setPlatforms] = useState<PlatformId[]>(["meta", "google", "openai"]);
  const [sales, setSales] = useState(false);
  const [deal, setDeal] = useState(2000);
  const toggle = (p: PlatformId) => setPlatforms((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));
  const save = () => {
    if (!name || !platforms.length) return;
    onAdd({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36), name, industry: industry || "General", emoji, platforms, sales: sales ? { enabled: true, avgDealSize: deal } : undefined });
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm animate-fade">
      <div className="card w-full max-w-md space-y-4 animate-pop">
        <div className="flex items-center justify-between"><div className="text-lg font-bold">Add a business</div><button onClick={onClose}><X className="h-5 w-5 text-zinc-500" /></button></div>
        <div className="flex gap-2">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 rounded-lg border border-ink-600 bg-ink-800 p-2 text-center text-lg" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" className="flex-1 rounded-lg border border-ink-600 bg-ink-800 p-2 text-sm outline-none focus:border-accent" />
        </div>
        <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry (e.g. Real estate, SaaS)" className="w-full rounded-lg border border-ink-600 bg-ink-800 p-2 text-sm outline-none focus:border-accent" />
        <div>
          <div className="label mb-2">Ad platforms</div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => toggle(p.id)} className={`rounded-full border px-3 py-1 text-xs transition ${platforms.includes(p.id) ? "border-transparent text-white" : "border-ink-600 text-zinc-400"}`} style={platforms.includes(p.id) ? { background: p.color } : {}}>{p.name}</button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-sm">
          <span>I do sales for this business <span className="block text-xs text-zinc-500">Adds a Sales tab with your pipeline</span></span>
          <input type="checkbox" checked={sales} onChange={(e) => setSales(e.target.checked)} className="h-5 w-5 accent-[#7c5cff]" />
        </label>
        {sales && <input type="number" value={deal} onChange={(e) => setDeal(+e.target.value)} placeholder="Avg deal size ($)" className="w-full rounded-lg border border-ink-600 bg-ink-800 p-2 text-sm" />}
        <button onClick={save} className="w-full rounded-xl bg-accent py-2.5 font-semibold transition hover:brightness-110 active:scale-[0.98]">Add business</button>
      </div>
    </div>
  );
}
