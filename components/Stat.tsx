import React from "react";
import Image from "next/image";

const Stat = ({ title, stat }: { title: string; stat: number }) => {
  return (
    <div className="flex gap-3 font-poppins items-center bg-white px-6 py-3 rounded-xl">
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
      <p className="font-semibold text-2xl font-open-sans"> {stat} </p>
    </div>
  );
};
export default Stat;
