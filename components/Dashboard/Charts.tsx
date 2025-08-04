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

interface Props {
  data: { date: string; pagesRead: number }[];
}

export default function Charts() {
  const { data } = useReadingSession();
  return (
    <div className="w-full h-[90%]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          {/* Gradient fill definition */}
          <defs>
            <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
            contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
            labelStyle={{ fontSize: 12 }}
            formatter={(value: number) => [`${value} pages`, "Pages Read"]}
          />

          <Area
            type="monotone"
            dataKey="pagesRead"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorPages)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
