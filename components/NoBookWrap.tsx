import React from "react";
import Image from "next/image";
type NoBookWrapProps = {
  name: string;
  title: string;
  message: string;
};
function NoBookWrap({ name, title, message }: NoBookWrapProps) {
  return (
    <div className="bg-white rounded-lg w-1/2 p-3 h-fit">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold  font-open-sans">{name}</h3>
        <button className="bg-gray-50 text-xs cursor-pointer text-green-500 px-3 py-2 text-open-sans font-poppins rounded-lg">
          View All
        </button>
      </div>
      <div className="w-full h-full flex justify-center items-center">
        <Image
          src={"/icons/empty-book.svg"}
          alt={"empty-book"}
          width={250}
          height={200}
        />
      </div>
      <div className="font-poppins">
        <h4 className="text-center mb-1 font-open-sans font-semibold text-gray-800">
          {title}
        </h4>
        <p className="text-center text-xs text-gray-500 mt-1">{message}</p>
      </div>
      <div className="w-full h-full">
        <Image
          src={"/icons/gradient.svg"}
          alt={"gradient"}
          width={500}
          height={100}
        />
      </div>
    </div>
  );
}

export default NoBookWrap;
