import React from "react";
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
    <div className="relative group overflow-hidden bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-500 transition-all duration-500 rounded-[2rem] p-6 w-full shadow-sm hover:shadow-xl hover:shadow-blue-500/5 font-poppins">
      <div className="relative z-10 flex flex-row items-center justify-between gap-4 w-full">
        <div className="flex flex-col gap-1.5 font-poppins">
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest">
            {title}
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tighter">
              {loading ? <MiniLoader /> : <CountUp end={stat} duration={2} />}
            </h3>
            {!loading && (
              <div className="flex text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                +<CountUp end={4} duration={2} />%
              </div>
            )}
          </div>
        </div>

        {icon && (
          <div
            className={`flex items-center justify-center p-3.5 rounded-2xl ${color || "text-blue-600 dark:text-blue-400"} ${bgColor || "bg-blue-100 dark:bg-blue-900/40"} shadow-sm flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
