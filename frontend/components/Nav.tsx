"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/run", label: "Çalıştır" },
  { href: "/intelligence", label: "İstihbarat" },
  { href: "/strategy", label: "Strateji" },
  { href: "/market", label: "Karar" },
  { href: "/campaign", label: "Kampanya" },
  { href: "/engineering", label: "Mühendislik" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-espresso-700/60 bg-espresso-900/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-copper font-display text-lg font-bold text-cream-50">
            B
          </span>
          <span className="font-display text-lg">
            Brand<span className="text-copper-light">OPS</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-espresso-700 text-cream-50"
                      : "text-cream-200/70 hover:text-cream-50"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
