"use client";

import {
  Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { CampaignProposal } from "@/lib/types";

const COLORS = ["#B5713A", "#CE8E54", "#8F5526", "#5E6B54", "#A8794B", "#6E4A2E", "#C99A6A"];

export default function BudgetChart({ budget }: { budget: CampaignProposal["budget"] }) {
  const data = [...budget.line_items]
    .sort((a, b) => b.amount - a.amount)
    .map((li) => ({ name: li.name, amount: li.amount, justification: li.justification }));

  const cur = budget.currency || "USD";

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="eyebrow">Bütçe Dağılımı</p>
        <p className="font-mono text-copper-light">
          Toplam: {budget.total.toLocaleString("en-US")} {cur}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(260, data.length * 38)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={210}
            tick={{ fill: "#E7D7C2", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(181,113,58,0.08)" }}
            contentStyle={{
              background: "#2A1E18", border: "1px solid #4F392D",
              borderRadius: 12, color: "#F3EADD", fontSize: 12, maxWidth: 320,
            }}
            formatter={(v: number) => [`${v.toLocaleString("en-US")} ${cur}`, "Tutar"]}
            labelFormatter={(l) => l as string}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
