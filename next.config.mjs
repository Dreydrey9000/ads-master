import { fileURLToPath } from "node:url";
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, env: { NEXT_PUBLIC_CONVEX_URL: "" }, outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)) };
export default nextConfig;
