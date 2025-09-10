"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useReadingSession } from "@/hooks/useUsers";
import { useIsDarkMode } from "../is-dark";

interface Props {
  data: { date: string; pagesRead: number }[];
}

export default function Charts() {
  const isDark = useIsDarkMode();

  const { data } = useReadingSession();
  return (
    <div className="w-[445px] relative transform -translate-x-10 sm:translate-x-0 md:w-full h-[90%]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          {/* Gradient fill definition */}
          <defs>
            <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isDark ? "#60a5fa" : "#3b82f6"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isDark ? "#60a5fa" : "#3b82f6"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(d) => d.slice(5)} // shows MM-DD
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#f9fafb", // slate-800 or zinc-50
              borderRadius: "8px",
              border: "none",
              color: isDark ? "#f9fafb" : "#111827", // zinc-50 vs zinc-900
            }}
            labelStyle={{
              fontSize: 12,
              color: isDark ? "#d1d5db" : "#4b5563", // zinc-300 vs zinc-600
            }}
            formatter={(value: number) => [`${value} pages`, "Pages Read"]}
          />

          <Area
            type="monotone"
            dataKey="pagesRead"
            stroke="#3b82f6" // You could also darken/lighten this for contrast
            strokeWidth={2}
            fill="url(#colorPages)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
