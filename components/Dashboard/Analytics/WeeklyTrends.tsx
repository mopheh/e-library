"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface WeeklyTrendsProps {
  data: { date: string; minutes: number; departmentAverage: number; day: string }[];
}

const WeeklyTrends = ({ data }: WeeklyTrendsProps) => {
  return (
    <Card className="h-full border-none shadow-none bg-zinc-50 dark:bg-zinc-900/50">
      <CardHeader>
        <CardTitle>Reading Activity</CardTitle>
        <CardDescription>
            Your reading time vs Department Average (Last 7 days).
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="day"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: any, name: any) => [
                  `${value}m`, 
                  name === "minutes" ? "You" : "Dept Avg"
                ] as [string, string]}
              />
              <Bar 
                dataKey="minutes" 
                name="minutes"
                fill="currentColor" 
                radius={[4, 4, 0, 0]} 
                className="fill-indigo-500 dark:fill-indigo-400"
              />
              <Bar 
                dataKey="departmentAverage" 
                name="departmentAverage"
                fill="currentColor" 
                radius={[4, 4, 0, 0]} 
                className="fill-slate-300 dark:fill-slate-700"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyTrends;
