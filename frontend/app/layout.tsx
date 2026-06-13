import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandOPS — Otonom Strateji Motoru",
  description:
    "CDSG × Food Empire — pazar girişi stratejisi ve kampanya tasarımı için otonom çok-ajanlı pipeline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
