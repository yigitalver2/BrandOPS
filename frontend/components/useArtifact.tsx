"use client";

import { useEffect, useState } from "react";

// Simple artifact loader — manages loading / error / empty states.
export function useArtifact<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loader()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, error, loading: !data && !error };
}

export function TrendBadge({ trend }: { trend?: string }) {
  const map: Record<string, { sym: string; cls: string }> = {
    up: { sym: "↑", cls: "text-emerald-400" },
    down: { sym: "↓", cls: "text-rose-400" },
    flat: { sym: "→", cls: "text-cream-200/60" },
    "n/a": { sym: "·", cls: "text-cream-200/40" },
  };
  const t = map[trend ?? "n/a"] ?? map["n/a"];
  return <span className={`font-mono ${t.cls}`}>{t.sym}</span>;
}
