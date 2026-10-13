"use client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs';
import type { ReactNode } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = url ? new ConvexReactClient(url) : null;

/** No Convex URL yet? The app still runs on demo data. */
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return client ? <ConvexAuthNextjsProvider client={client}>{children}</ConvexAuthNextjsProvider> : <>{children}</>;
}
