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
}

const Stat = ({ title, stat, icon, color, bgColor }: StatProps) => {
  return (
    <div className="flex flex-row items-center gap-3 font-poppins bg-white dark:bg-zinc-950 px-4 py-3 rounded-xl w-full sm:w-[15rem] max-w-xs sm:max-w-sm md:max-w-md">
      <div className="flex sm:flex-row flex-row-reverse items-center gap-2 sm:gap-4 justify-around sm:justify-between w-full">
        <div className="flex flex-col items-center gap-1">
          <p className="dark:text-zinc-300 text-zinc-700 text-[12px]">
            {title}
          </p>
          <div className="font-semibold flex gap-2 text-sm sm:text-lg font-open-sans sm:mt-0">
            {!stat ? <MiniLoader /> : <CountUp end={stat} duration={2} />}
            <div className="flex text-xs text-green-500 items-center">
              +<CountUp end={46} duration={2} />%
            </div>
          </div>
        </div>

        {icon && (
          <div
            className={`p-2 rounded-full ${color} ${bgColor} text-xl flex-shrink-0`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stat;
