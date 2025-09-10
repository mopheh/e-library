import React from "react";
import {
  FaArrowRight,
  FaBook,
  FaGraduationCap,
  FaRegFileAlt,
} from "react-icons/fa";
import { ProgressBar } from "@/components/Dashboard/ProgressBar";
import { useRouter } from "next/navigation";

const ViewedBook = ({ book }: { book: any }) => {
  const router = useRouter();
  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-900 p-5 rounded-lg ">
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <FaBook size={40} className="text-zinc-500" />
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-cabin font-medium">{book.title}</h2>
            <div className="flex gap-3 text-xs items-center font-poppins">
              <div className="text-xs flex gap-2 items-center">
                <FaGraduationCap className="text-zinc-500" />
                <span className="font-normal">{book.course}</span>
              </div>
              <div className="text-xs flex gap-2 items-center">
                <FaRegFileAlt className="text-zinc-500" />
                <span className="font-normal">{book.type}</span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="cursor-pointer p-2 rounded-full bg-zinc-100 dark:bg-zinc-950"
          onClick={() => {
            router.push(`/student/book/${book.id}`);
          }}
        >
          <FaArrowRight />
        </div>
      </div>
      <div>
        <div className="flex justify-between">
          <span className="text-xs text-neutral-700 dark:text-neutral-300 mb-2 block font-medium">
            Progress
          </span>
          <span className="text-xs text-neutral-700 dark:text-neutral-300 mb-2 block font-rubik">
            {book.progress || 0}% of 100%
          </span>
        </div>
        <ProgressBar value={book.progress || 0} />
      </div>
    </div>
  );
};
export default ViewedBook;
