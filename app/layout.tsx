import "./globals.css";
import type { Metadata } from "next";
import ConvexClientProvider from "@/components/ConvexClientProvider";

export const metadata: Metadata = { title: { default: "Overview | Ads Master", template: "%s | Ads Master" }, description: "Your local advertising workspace. Import reports and compare platform performance." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ConvexClientProvider>{children}</ConvexClientProvider></body>
    </html>
  );
}
