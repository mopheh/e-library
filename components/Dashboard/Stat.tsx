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
    <div className="flex gap-3 font-poppins items-center bg-white dark:bg-gray-950 px-6 py-3 rounded-xl">
      {icon && (
        <div className={`p-2 rounded-full ${color} ${bgColor} text-xl`}>
          {icon}
        </div>
      )}
      <p className="text-gray-500 text-xs"> {title} </p>
      <div className="flex text-xs  gap-2 text-green-500">
        <Image
          src={"/icons/caret-up.svg"}
          alt={"caret"}
          width={12}
          height={12}
        />
        4
      </div>
      <div className="font-semibold text-2xl font-open-sans">
        {!stat ? <MiniLoader /> : <CountUp end={stat} duration={2} />}
      </div>
    </div>
  )
}
export default Stat
