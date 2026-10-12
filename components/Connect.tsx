"use client";
import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { RefreshCw, Sparkles, Trash2, Plug } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PLATFORMS } from "@/lib/platforms";
import type { LiveData } from "@/lib/live";
import type { PlatformId } from "@/lib/types";
import { PlatformDot } from "./ui";

const HELP: Partial<Record<PlatformId, { id: string; token: string }>> = {
  openai: { id: "ChatGPT Ads account ID", token: "API key (Ads Manager → Settings)" },
  meta: { id: "Ad account ID (act_…)", token: "System-user access token" },
};

/** Live Connections tab: connect ChatGPT Ads + Meta now; the rest show "coming soon" until their fetchers land. */
export default function Connect({ live }: { live: LiveData }) {
  const connect = useMutation(api.accounts.connect);
  const disconnect = useMutation(api.accounts.disconnect);
  const syncNow = useAction(api.sync.syncBusiness);
  const refreshInsights = useAction(api.insights.generate);
  const [open, setOpen] = useState<PlatformId | null>(null);
  const [form, setForm] = useState({ externalId: "", token: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const businessId = live.businessId as Id<"businesses">;

  const run = async (label: string, fn: () => Promise<unknown>) => { setBusy(label); try { await fn(); } catch (e) { alert(String(e)); } finally { setBusy(null); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button disabled={!!busy} onClick={() => run("sync", () => syncNow({ businessId }))} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold active:scale-95 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${busy === "sync" ? "animate-spin" : ""}`} /> Sync now
        </button>
        <button disabled={!!busy} onClick={() => run("ai", () => refreshInsights({ businessId }))} className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-2 text-sm active:scale-95 disabled:opacity-50">
          <Sparkles className={`h-4 w-4 ${busy === "ai" ? "animate-pulse" : ""}`} /> Refresh AI insights
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PLATFORMS.map((p) => {
          const accts = live.accounts.filter((a) => a.platform === p.id);
          const ready = Boolean(HELP[p.id]);
          return (
            <div key={p.id} className="card space-y-3 animate-rise">
              <div className="flex items-center justify-between">
                <PlatformDot id={p.id} />
                {ready ? (
                  <button onClick={() => { setOpen(open === p.id ? null : p.id); setForm({ externalId: "", token: "" }); }} className="flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-zinc-300 hover:border-accent active:scale-95"><Plug className="h-3 w-3" /> Connect</button>
                ) : <span className="text-[10px] uppercase tracking-wider text-zinc-600">Coming soon</span>}
              </div>
              {accts.map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-xs">
                  <div><div className="text-zinc-200">{a.name ?? a.externalId}</div>
                    <div className={a.status === "error" ? "text-ugly" : "text-zinc-500"}>{a.status === "error" ? a.lastError : a.lastSyncedAt ? `Synced ${new Date(a.lastSyncedAt).toLocaleString()}` : a.status}</div></div>
                  <button onClick={() => run("rm", () => disconnect({ adAccountId: a._id }))} className="text-zinc-500 hover:text-ugly"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {open === p.id && HELP[p.id] && (
                <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); run("connect", async () => { await connect({ businessId, platform: p.id, externalId: form.externalId.trim(), token: form.token.trim() }); setOpen(null); }); }}>
                  <input required placeholder={HELP[p.id]!.id} value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-accent" />
                  <input required type="password" placeholder={HELP[p.id]!.token} value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-accent" />
                  <button disabled={!!busy} className="w-full rounded-lg bg-accent py-2 text-sm font-semibold active:scale-95 disabled:opacity-50">Save & connect</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
