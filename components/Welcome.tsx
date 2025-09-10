import React from "react";

const Welcome = ({
  name,
  guide,
}: {
  name: string | null | undefined;
  guide: string;
}) => {
  return (
    <div className="flex flex-col px-2">
      <h3 className="font-open-sans mb-1 text-xl sm:text-2xl font-semibold">
        Welcome, {name}
      </h3>
      <span className="font-poppins text-xs text-zinc-500 dark:text-zinc-400">
        {guide}
      </span>
    </div>
  );
};
export default Welcome;
