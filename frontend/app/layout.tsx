import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandOPS — Autonomous Strategy Engine",
  description:
    "CDSG × Food Empire — autonomous multi-agent pipeline for market entry strategy and campaign design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
