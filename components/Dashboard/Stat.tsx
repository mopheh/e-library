import React from "react";
import Image from "next/image";
import MiniLoader from "@/components/Loader";
import CountUp from "react-countup";

interface StatProps {
  title: string;
  stat: number;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
  loading?: boolean;
}

const Stat = ({ title, stat, icon, color, bgColor, loading }: StatProps) => {
  return (
    <div className="relative group overflow-hidden bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 hover:border-blue-500/30 dark:hover:border-blue-500/30 rounded-2xl p-5 w-full transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)]">
      {/* Subtle glowing halo on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-row items-center justify-between gap-4 w-full">
        <div className="flex flex-col gap-1.5">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider font-poppins">
            {title}
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-bold font-cairo text-zinc-900 dark:text-zinc-50 tracking-tight">
              {loading ? <MiniLoader /> : <CountUp end={stat} duration={2} />}
            </h3>
            {!loading && (
              <div className="flex text-xs font-poppins font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                +<CountUp end={46} duration={2} />%
              </div>
            )}
          </div>
        </div>

        {icon && (
          <div
            className={`flex items-center justify-center p-3.5 rounded-xl ${color || "text-blue-600 dark:text-blue-400"} ${bgColor || "bg-blue-50 dark:bg-blue-900/20"} shadow-inner flex-shrink-0 transition-transform duration-500 group-hover:scale-110`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
