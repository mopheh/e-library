"use client";

import React from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIsDarkMode } from "@/components/is-dark";
import { DEGREE_CLASSES } from "@/lib/grading";
import type { Grades } from "@/hooks/useGrades";

// Validated with the dataviz palette script on both surfaces (light #fcfcfb,
// dark #18181b): same pair works in both modes. Tritan separation sits in the
// 6-8 floor band, so identity also rides on mark type (bars vs line+dots)
// and the legend - never colour alone.
const GPA_COLOR = "#6366f1";
const CGPA_COLOR = "#059669";

function label(session: string, semester: string) {
  const [a, b] = session.split("/");
  return `${a.slice(2)}/${b.slice(2)} ${semester === "FIRST" ? "1st" : "2nd"}`;
}

export function GpaTrendChart({ data }: { data: Grades }) {
  const isDark = useIsDarkMode();
  const points = data.summary.timeline.map((t) => ({ name: label(t.session, t.semester), gpa: t.gpa, cgpa: t.cgpa }));
  if (points.length < 2) return null;

  const ink = isDark ? "#a1a1aa" : "#71717a"; // muted text token
  const grid = isDark ? "#27272a" : "#f4f4f5";
  const surface = isDark ? "#18181b" : "#ffffff";

  return (
    <div className="rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-cabin font-black text-base tracking-tight">GPA by semester</h2>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: GPA_COLOR }} /> Semester GPA</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full" style={{ background: CGPA_COLOR }} /> CGPA</span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 44, bottom: 0, left: -20 }} barCategoryGap="35%">
            <CartesianGrid vertical={false} stroke={grid} />
            <XAxis dataKey="name" tick={{ fill: ink, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: ink, fontSize: 10 }} axisLine={false} tickLine={false} />
            {DEGREE_CLASSES.filter((c) => c.min > 0).map((c) => (
              <ReferenceLine
                key={c.key}
                y={c.min}
                stroke={ink}
                strokeOpacity={0.35}
                strokeDasharray="3 4"
                label={{ value: c.short, position: "right", fill: ink, fontSize: 9 }}
              />
            ))}
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              contentStyle={{ background: surface, border: `1px solid ${grid}`, borderRadius: 12, fontSize: 12, color: isDark ? "#e4e4e7" : "#27272a" }}
              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
              formatter={(v, name) => [typeof v === "number" ? v.toFixed(2) : "–", name === "gpa" ? "Semester GPA" : "CGPA"]}
            />
            <Bar dataKey="gpa" fill={GPA_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line
              dataKey="cgpa"
              stroke={CGPA_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: CGPA_COLOR, stroke: surface, strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
