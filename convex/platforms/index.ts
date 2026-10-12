import type { PlatformFetcher } from "./types";
import { meta } from "./meta";
import { openai } from "./openai";

/** Add Google / TikTok / LinkedIn / YouTube here as they're built. */
export const fetchers: Partial<Record<string, PlatformFetcher>> = { meta, openai };
