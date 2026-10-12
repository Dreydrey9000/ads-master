import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// 3:00 AM Eastern (07:00 UTC): pull the last 30 days from every connected account (covers ChatGPT Ads' 24–48h conversion lag).
crons.daily("nightly ad sync", { hourUTC: 7, minuteUTC: 0 }, internal.sync.syncAll, {});
// An hour later, re-score every business with fresh numbers.
crons.daily("nightly AI insights", { hourUTC: 8, minuteUTC: 0 }, internal.insights.generateAll, {});
export default crons;
