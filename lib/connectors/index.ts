import { meta } from "./meta";
import { openaiAds } from "./openai-ads";
import { google, tiktok, linkedin, youtube } from "./stubs";
import type { AdConnector, PlatformId } from "../types";

export const connectors: Record<PlatformId, AdConnector> = {
  meta, google, tiktok, linkedin, youtube, openai: openaiAds,
};
