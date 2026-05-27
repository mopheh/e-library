import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CountUp from "react-countup";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  loading?: boolean;
  iconClassName?: string;
  accentColor?: string;  // tailwind bg class for left border accent
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  loading,
  iconClassName,
  accentColor = "bg-zinc-900 dark:bg-zinc-50",
}: StatCardProps) {
  const isNumeric = typeof value === "number";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-300 group",
        className
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-4 bottom-4 w-[3px] rounded-full", accentColor)} />

      <div className="px-6 py-5">
        {/* Icon + Trend row */}
        <div className="flex items-center justify-between mb-5">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", iconClassName ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600")}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && !loading && (
            <span className={cn(
              "text-[10px] font-black font-cabin uppercase tracking-widest px-2.5 py-1 rounded-xl",
              trend.isPositive
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400"
            )}>
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-20 rounded-xl" />
            <Skeleton className="h-3 w-28 rounded-xl" />
          </div>
        ) : (
          <div>
            <p className="text-2xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-0.5">
              {isNumeric ? <CountUp end={value as number} duration={1.6} separator="," /> : value}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-cabin">
              {title}
            </p>
            {description && (
              <p className="text-[10px] text-zinc-400 mt-1.5 font-poppins leading-relaxed">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
