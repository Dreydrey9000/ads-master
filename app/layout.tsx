import "./globals.css";
import type { Metadata } from "next";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';

export const metadata: Metadata = { title: { default: "Overview | Ads Master", template: "%s | Ads Master" }, description: "Your advertising workspace. Connect private reports and compare platform performance." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = <ConvexClientProvider>{children}</ConvexClientProvider>;
  return (
    <html lang="en">
      <body>{process.env.NEXT_PUBLIC_CONVEX_URL ? <ConvexAuthNextjsServerProvider>{content}</ConvexAuthNextjsServerProvider> : content}</body>
    </html>
  );
}
