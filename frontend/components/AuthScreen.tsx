"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark, Wordmark } from "@/components/Logo";

type Mode = "login" | "signup";

const AGENTS = [
  { fill: "#2A211C", text: "#F4ECDF", label: "01" },
  { fill: "#A9683A", text: "#F4ECDF", label: "02" },
  { fill: "#C39A6E", text: "#F4ECDF", label: "03" },
  { fill: "#DEC9A9", text: "#6E4A2E", label: "04" },
];

const FEATURES = [
  "Autonomous strategy extraction from annual reports",
  "Debate-driven target market selection",
  "Full campaign with 4Ps, budget and Gantt",
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function AuthScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<Mode>(
    params.get("mode") === "signup" ? "signup" : "login"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup" ? { email, password, name } : { email, password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* — Sol: marka paneli — */}
      <div className="relative hidden overflow-hidden border-r border-espresso-600/60 bg-gradient-to-br from-espresso-900 via-espresso-800 to-[#E7DCC9] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="blob blob-a left-[-10%] top-[-8%] h-[32rem] w-[32rem] bg-copper/25" />
          <div className="blob blob-b bottom-[-12%] right-[-8%] h-[28rem] w-[28rem] bg-sage/20" />
          <div className="dot-grid absolute inset-0 opacity-50" />
        </div>
        <div className="grain absolute inset-0" aria-hidden />

        <div className="relative flex items-center gap-2.5">
          <LogoMark className="h-7 w-auto" />
          <Wordmark className="text-lg" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative"
        >
          <div className="flex items-center gap-3">
            {AGENTS.map((a, i) => (
              <motion.span
                key={a.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.25 + i * 0.12 }}
                className="grid h-11 w-11 place-items-center rounded-2xl font-mono text-sm font-semibold shadow-sm"
                style={{ backgroundColor: a.fill, color: a.text }}
              >
                {a.label}
              </motion.span>
            ))}
          </div>
          <h1 className="mt-8 max-w-md font-display text-4xl font-bold leading-tight text-espresso-900">
            Sign in to the{" "}
            <span className="text-copper-dark">autonomous</span> strategy engine.
          </h1>
          <ul className="mt-7 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-cream-100/90">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* — Right: form — */}
      <div className="relative flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Mobil logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark className="h-7 w-auto" />
            <Wordmark className="text-lg" />
          </div>

          <h2 className="font-display text-2xl font-semibold">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-1 text-sm text-cream-200/60">
            {mode === "login"
              ? "Sign in to continue."
              : "Get started in a few seconds."}
          </p>

          {/* Mode sekmeleri */}
          <div className="mt-6 grid grid-cols-2 rounded-full border border-espresso-600 p-1 text-sm">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="relative rounded-full px-4 py-1.5 font-medium transition-colors"
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-full bg-copper"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={`relative ${mode === m ? "text-white" : "text-cream-200/70"}`}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden"
                >
                  <Field label="Name (optional)">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={inputCls}
                      autoComplete="name"
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brandops.ai"
                className={inputCls}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  className={`${inputCls} pr-11`}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-200/50 transition-colors hover:text-copper-dark"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Spinner />
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cream-200/60">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-medium text-copper-dark hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-espresso-600 bg-espresso-800 px-4 py-2.5 text-cream-100 placeholder:text-cream-200/40 outline-none transition-colors focus:border-copper focus:ring-2 focus:ring-copper/25";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-cream-200/70">{label}</span>
      {children}
    </label>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-copper-dark">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 4.6A10 10 0 0112 5c6.5 0 10 7 10 7a18 18 0 01-3.3 4M6.1 6.1A18 18 0 002 12s3.5 7 10 7a10 10 0 003.4-.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
