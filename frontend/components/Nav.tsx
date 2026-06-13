"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark, Wordmark } from "@/components/Logo";

const LINKS = [
  { href: "/run", label: "Pipeline'ı Çalıştır" },
];

const ARTIFACT_LINKS = [
  { href: "/artifacts/intelligence", label: "01 · İstihbarat" },
  { href: "/artifacts/strategy",     label: "02 · Strateji" },
  { href: "/artifacts/market",       label: "03 · Pazar" },
  { href: "/artifacts/campaign",     label: "04 · Kampanya" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-espresso-700/60 bg-espresso-900/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="BrandOPS — ana sayfa">
          <LogoMark className="h-7 w-auto" />
          <Wordmark className="text-lg" />
        </Link>
        <ul className="-mx-1 flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
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
          <li><ResultsDropdown /></li>
        </ul>
        <UserMenu />
      </nav>
    </header>
  );
}

function ResultsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const path = usePathname();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const anyActive = ARTIFACT_LINKS.some((l) => path === l.href);

  return (
    <li ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
          anyActive ? "bg-espresso-700 text-cream-50" : "text-cream-200/70 hover:text-cream-50"
        }`}
      >
        Sonuçlar
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-espresso-600/60 bg-espresso-800 shadow-xl">
          {ARTIFACT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-sm transition-colors hover:bg-espresso-700 ${
                path === l.href ? "text-copper-dark" : "text-cream-200/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => active && setEmail(d.user?.email ?? null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  const initial = (email?.[0] ?? "•").toUpperCase();

  return (
    <div className="flex shrink-0 items-center gap-2 border-l border-espresso-600/60 pl-3">
      <span
        className="grid h-7 w-7 place-items-center rounded-full bg-copper text-xs font-semibold text-white"
        title={email ?? undefined}
      >
        {initial}
      </span>
      <span className="hidden max-w-[12rem] truncate text-sm text-cream-200/70 lg:block">
        {email ?? "—"}
      </span>
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="rounded-full p-1.5 text-cream-200/60 transition-colors hover:bg-espresso-700 hover:text-copper-dark disabled:opacity-50"
        title="Çıkış yap"
        aria-label="Çıkış yap"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      </button>
    </div>
  );
}
