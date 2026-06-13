"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Wordmark } from "@/components/Logo";

// Four agents = pipeline. Each "completes" one by one in the right panel.
const AGENTS = [
  { fill: "#2A211C", text: "#F4ECDF", label: "01", name: "Intelligence", tag: "report analysis" },
  { fill: "#A9683A", text: "#F4ECDF", label: "02", name: "Strategy", tag: "GTM periods" },
  { fill: "#C39A6E", text: "#F4ECDF", label: "03", name: "Decision", tag: "market selection" },
  { fill: "#DEC9A9", text: "#6E4A2E", label: "04", name: "Campaign", tag: "4P + budget" },
];

// Headline — accent words get shimmer.
const WORDS: { t: string; accent?: boolean }[] = [
  { t: "An" }, { t: "autonomous" }, { t: "engine" }, { t: "for" },
  { t: "market", accent: true }, { t: "entry", accent: true },
  { t: "strategy" }, { t: "and" }, { t: "campaign" }, { t: "design." },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: reduce ? 0 : 0.1 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
  };

  return (
    // Full-bleed: arka plan tüm genişliği kaplar, ortadaki "kutu" görüntüsü kalkar.
    <section className="relative left-1/2 -mt-10 w-screen -translate-x-1/2 overflow-hidden border-b border-espresso-700/50">
      {/* — Ambient arka plan (tam genişlik) — */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob blob-a left-[-6%] top-[-12%] h-[38rem] w-[38rem] bg-copper/20" />
        <div className="blob blob-b right-[-4%] top-[2%] h-[34rem] w-[34rem] bg-sage/15" />
        <div className="blob blob-a bottom-[-18%] left-[35%] h-[30rem] w-[30rem] bg-espresso/30" />
        <div className="dot-grid absolute inset-0 opacity-60" />
      </div>
      <div className="grain absolute inset-0 -z-10" aria-hidden />

      {/* — İçerik (sayfa ızgarasıyla hizalı) — */}
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:min-h-[84vh] lg:grid-cols-12 lg:gap-8">
        {/* Sol: metin */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="lg:col-span-7"
        >
          <motion.div variants={item} className="flex items-center gap-3">
            <Wordmark className="text-2xl md:text-3xl" />
            <span className="hidden h-5 w-px bg-espresso-600 sm:block" />
            <span className="hidden items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-copper-dark/80 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
              </span>
              Autonomous Strategy Engine
            </span>
          </motion.div>

          <motion.h1
            variants={container}
            className="mt-7 flex max-w-3xl flex-wrap font-display text-5xl font-bold leading-[1.04] md:text-6xl xl:text-7xl"
          >
            {WORDS.map((w, i) => (
              <motion.span key={i} variants={item} className="mr-[0.26em]">
                <span className={w.accent ? "text-shimmer" : undefined}>{w.t}</span>
              </motion.span>
            ))}
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg text-cream-200/70">
            BrandOPS converts the CDSG × Food Empire consulting brief into a complete
            multi-agent pipeline — analyzing annual reports, debating to select the target
            market, and generating a full marketing campaign.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
            <Link href="/run" className="btn-primary glow-pulse group">
              Run Pipeline
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/intelligence"
              className="inline-flex items-center rounded-full border border-espresso-600 px-6 py-3 text-cream-100 transition-colors hover:border-copper hover:bg-espresso-800/50"
            >
              View Outputs
            </Link>
          </motion.div>
        </motion.div>

        {/* Sağ: canlı ajan konsolu */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 28, scale: reduce ? 1 : 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: reduce ? 0 : 0.35 }}
          className="lg:col-span-5"
        >
          <AgentConsole reduce={!!reduce} />
        </motion.div>
      </div>
    </section>
  );
}

function AgentConsole({ reduce }: { reduce: boolean }) {
  return (
    <div className="card relative overflow-hidden p-5 shadow-xl shadow-espresso/5 md:p-6">
      {/* tarayıcı parıltısı */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cream-50/[0.06] to-transparent"
          animate={{ x: ["-130%", "360%"] }}
          transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 }}
        />
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-xs text-cream-200/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-copper" />
          </span>
          live · pipeline
        </span>
        <span className="font-mono text-[11px] text-copper-dark">4 agents</span>
      </div>

      <div className="mt-5 space-y-3.5">
        {AGENTS.map((a, i) => (
          <div key={a.label} className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-semibold"
              style={{ backgroundColor: a.fill, color: a.text }}
            >
              {a.label}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm text-cream-100">{a.name}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-cream-200/45">
                  {a.tag}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-espresso-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-copper-dark via-copper to-copper-light"
                  initial={{ width: reduce ? "100%" : 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.9, ease: EASE, delay: reduce ? 0 : 0.7 + i * 0.32 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-espresso-700/60 pt-4 font-mono text-[11px] text-cream-200/50">
        <span>real token · latency tracking</span>
        <motion.span
          className="flex items-center gap-1 text-copper-dark"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 2.1, duration: 0.5 }}
        >
          pipeline ready ✓
        </motion.span>
      </div>
    </div>
  );
}
