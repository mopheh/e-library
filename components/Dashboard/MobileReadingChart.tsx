"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useReadingSession } from "@/hooks/useUsers";
import { useIsDarkMode } from "../is-dark";
import { BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg px-3 py-2 text-xs font-poppins">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-black font-cabin" style={{ color: p.color }}>
          {p.value} <span className="font-normal text-zinc-400">pages</span>
        </p>
      ))}
    </div>
  );
}

export default function MobileReadingChart() {
  const isDark = useIsDarkMode();
  const { data, isLoading } = useReadingSession();

  const hasActivity =
    Array.isArray(data) &&
    data.some((d: any) => (d.pagesRead || 0) > 0 || (d.departmentAverage || 0) > 0);

  const totalPages =
    Array.isArray(data)
      ? data.reduce((sum: number, d: any) => sum + (d.pagesRead || 0), 0)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-5 rounded-[22px] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">
            Analytics
          </p>
          <h3 className="text-sm font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">
            Reading Activity
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {hasActivity && (
            <div className="text-right">
              <p className="text-[18px] font-black font-cabin text-zinc-900 dark:text-zinc-50 leading-none">
                {totalPages}
              </p>
              <p className="text-[9px] font-bold font-cabin uppercase tracking-widest text-zinc-400 mt-0.5">
                pages/wk
              </p>
            </div>
          )}
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Legend */}
      {hasActivity && (
        <div className="px-5 pb-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-zinc-400 font-cabin uppercase tracking-wide">You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" style={{ borderTop: "2px dashed" }} />
            <span className="text-[9px] font-bold text-zinc-400 font-cabin uppercase tracking-wide">Dept avg</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[130px] px-2 pb-4">
        {isLoading ? (
          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ) : !hasActivity ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300 dark:text-zinc-600">
            <BookOpen className="w-6 h-6" />
            <p className="text-[10px] font-bold font-cabin uppercase tracking-wide">
              No data yet — start reading!
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 10, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="mobileColorPages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mobileColorDept" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f4f4f5"} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fontFamily: "var(--font-cabin)", fontWeight: 700, fill: isDark ? "#52525b" : "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(d) => {
                  if (!d) return "";
                  const parts = d.split("-");
                  if (parts.length === 3) {
                    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    return date.toLocaleDateString("en-US", { weekday: "narrow" });
                  }
                  return d.slice(5);
                }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 9, fontFamily: "var(--font-cabin)", fontWeight: 700, fill: isDark ? "#52525b" : "#a1a1aa" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? "#3f3f46" : "#e4e4e7", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="departmentAverage"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#mobileColorDept)"
                dot={false}
                activeDot={{ r: 3, fill: "#9ca3af" }}
              />
              <Area
                type="monotone"
                dataKey="pagesRead"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#mobileColorPages)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
