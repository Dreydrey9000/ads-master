"use client";
/**
 * Legacy provider scaffold is disabled. Authentication uses the separate backend/ deployment.
 */
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BUSINESSES } from "@/ads-master.config";

// Legacy ad-account functions are not deployed. Convex is used only for verified auth.
export const LIVE = false;

function useLiveConvex(slug: string) {
  const syncConfig = useMutation(api.businesses.syncFromConfig);
  useEffect(() => { syncConfig({ businesses: BUSINESSES }).catch(console.error); }, [syncConfig]);
  return useQuery(api.dashboard.get, { slug }) ?? null;
}
const useLiveOff = (_slug: string) => null;

export type LiveData = NonNullable<ReturnType<typeof useLiveConvex>>;
export const useLive: (slug: string) => LiveData | null = LIVE ? useLiveConvex : useLiveOff;
