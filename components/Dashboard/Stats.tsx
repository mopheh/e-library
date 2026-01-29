import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Stat from "@/components/Dashboard/Stat";
import Welcome from "@/components/Welcome";
import { useMyBooks } from "@/hooks/useBooks";
import { useReadingSession } from "@/hooks/useUsers";
import {
  HiOutlineBookOpen,
  HiOutlineDocumentText,
  HiOutlineCalendar,
} from "react-icons/hi";
import UserStats from "./UserStats";

const Stats = ({ data }: { data: { date: string; pagesRead: number }[] }) => {
  const [pagesRead, setPagesRead] = useState(0);

  useEffect(() => {
    if (data) {
      const books = data.reduce(
        (sum: number, book: { pagesRead: number }) => sum + book.pagesRead,
        0,
      );
      setPagesRead(books);
    }
  }, [data]);

  return (
    <div className="sm:flex gap-2 sm:gap-6 my-10">
      <UserStats pagesRead={pagesRead} data={data} />
    </div>
  );
};
export default Stats;
