"use client";

import type { CampaignProposal } from "@/lib/types";

const MONTHS = ["O", "Ş", "M", "N", "M", "H", "T", "A", "E", "E", "K", "A"];

// 12 aylık Gantt — JSON gantt verisinden beslenir (hardcode yok).
export default function GanttChart({ gantt }: { gantt: CampaignProposal["gantt"] }) {
  return (
    <div>
      <p className="eyebrow mb-3">Zaman Çizelgesi · 12 Aylık Gantt</p>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Ay başlıkları */}
          <div className="mb-2 grid grid-cols-[200px_repeat(12,1fr)] gap-1">
            <div />
            {MONTHS.map((m, i) => (
              <div key={i} className="text-center font-mono text-[10px] text-cream-200/50">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Satırlar */}
          <div className="space-y-1.5">
            {gantt.map((g, i) => (
              <div key={i} className="grid grid-cols-[200px_repeat(12,1fr)] items-center gap-1">
                <div className="pr-2 text-xs text-cream-200/80">{g.activity}</div>
                {Array.from({ length: 12 }, (_, m) => {
                  const month = m + 1;
                  const active = month >= g.start_month && month <= g.end_month;
                  const start = month === g.start_month;
                  const end = month === g.end_month;
                  return (
                    <div key={m} className="h-6">
                      {active && (
                        <div
                          className={`h-full bg-copper/80 ${start ? "rounded-l-md" : ""} ${
                            end ? "rounded-r-md" : ""
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
