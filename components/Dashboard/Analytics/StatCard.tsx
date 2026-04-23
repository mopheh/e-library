import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  loading?: boolean;
  iconClassName?: string;
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
}: StatCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden rounded-[2rem] border-none shadow-sm bg-white dark:bg-zinc-900 transition-all hover:shadow-md", 
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800",
            iconClassName
          )}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && !loading && (
             <div className={cn(
               "text-xs font-bold px-2 py-1 rounded-full",
               trend.isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
             )}>
               {trend.isPositive ? "+" : "-"}{trend.value}%
             </div>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold font-poppins tracking-tight text-zinc-900 dark:text-zinc-100">
              {value}
            </div>
            <p className="text-[13px] font-medium font-poppins text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            {description && !trend && (
              <p className="text-[11px] text-zinc-400 mt-1">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

