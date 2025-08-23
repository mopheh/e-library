import React from "react"
import Image from "next/image"
import MiniLoader from "@/components/Loader"
import CountUp from "react-countup"

interface StatProps {
    title: string
    stat: number
    icon?: React.ReactNode
    color?: string // e.g., "text-green-600"
    bgColor?: string // e.g., "bg-green-100"
}

const Stat = ({ title, stat, icon, color, bgColor }: StatProps) => {
    return (
        <div className="flex flex-row items-center gap-3 font-poppins bg-white dark:bg-gray-950 px-4 py-3 rounded-xl w-full max-w-xs sm:max-w-sm md:max-w-md">
            {/* Icon */}
            {icon && (
                <div className={`p-2 rounded-full ${color} ${bgColor} text-xl flex-shrink-0`}>
                    {icon}
                </div>
            )}

            {/* Text section */}
            <div className="flex flex-col sm:flex-row flex-col-reverse items-center sm:justify-between w-full">
                {/* Title + Trend */}
                <div className="flex flex-col  sm:flex-row items-center sm:gap-3">
                    <p className="text-gray-500 text-xs">{title}</p>
                    <div className="flex text-xs gap-1 text-green-500 items-center">
                        <Image
                            src={"/icons/caret-up.svg"}
                            alt={"caret"}
                            width={12}
                            height={12}
                        />
                        4
                    </div>
                </div>

                {/* Stat number */}
                <div className="font-semibold text-xl sm:text-2xl font-open-sans mt-1 sm:mt-0">
                    {!stat ? <MiniLoader /> : <CountUp end={stat} duration={2} />}
                </div>
            </div>
        </div>
    )
}

export default Stat
