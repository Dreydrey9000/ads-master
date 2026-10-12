"use client";
/**
 * Live data from Convex when NEXT_PUBLIC_CONVEX_URL is set, otherwise null (the UI falls back to demo data).
 * LIVE is a build-time constant, so the hook order never changes between renders.
 */
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BUSINESSES } from "@/ads-master.config";

export const LIVE = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

function useLiveConvex(slug: string) {
  const syncConfig = useMutation(api.businesses.syncFromConfig);
  useEffect(() => { syncConfig({ businesses: BUSINESSES }).catch(console.error); }, [syncConfig]);
  return useQuery(api.dashboard.get, { slug }) ?? null;
}
const useLiveOff = (_slug: string) => null;

export type LiveData = NonNullable<ReturnType<typeof useLiveConvex>>;
export const useLive: (slug: string) => LiveData | null = LIVE ? useLiveConvex : useLiveOff;
