type ProgressBarProps = {
  value: number // between 0 and 100
}

export const ProgressBar = ({ value }: ProgressBarProps) => {
  return (
    <div className="w-full h-[5px] bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#3b82f6] transition-all duration-300"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  )
}
