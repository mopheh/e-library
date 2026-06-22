import React from "react";

interface SectionHeaderProps {
  gradient: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}

export const SectionHeader = ({
  gradient,
  title,
  subtitle,
  badge,
}: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <div className={`w-1 h-6 bg-gradient-to-b ${gradient} rounded-full`} />
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-poppins">{title}</h2>
          {badge}
        </div>
        <p className="text-[11px] text-zinc-400 mt-0.5 font-poppins">{subtitle}</p>
      </div>
    </div>
  </div>
);
