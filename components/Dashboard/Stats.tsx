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

const Stats = () => {
  const { user } = useUser();
  const [pagesRead, setPagesRead] = useState(0);
  const { data: myBooks } = useMyBooks();
  const { data } = useReadingSession();

  useEffect(() => {
    if (data) {
      const books = data.reduce(
        (sum: number, book: { pagesRead: number }) => sum + book.pagesRead,
        0
      );
      setPagesRead(books);
    }
  }, [data]);

  return (
    <div className="sm:flex gap-2 sm:gap-6 my-10">
      <UserStats />
    </div>
  );
};
export default Stats;
