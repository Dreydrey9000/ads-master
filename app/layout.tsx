import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ads Master", description: "Every ad platform, every business, one brain." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1b1440_0%,_#07080c_55%)]">{children}</body>
    </html>
  );
}
