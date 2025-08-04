import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import Stat from "@/components/Dashboard/Stat";
import Welcome from "@/components/Welcome";
import { useMyBooks } from "@/hooks/useBooks";
import { useReadingSession } from "@/hooks/useUsers";

const Stats = () => {
  const { user } = useUser();
  const [pagesRead, setPagesRead] = useState(0);
  const { data: myBooks } = useMyBooks();
  const { data } = useReadingSession();
  useEffect(() => {
    if (data) {
      const books = data.reduce(
        (sum: any, book: { pagesRead: any }) => sum + book.pagesRead,
        0,
      );
      setPagesRead(books);
    }
  }, [data]);
  return (
    <div className="flex gap-8 my-10">
      <Welcome
        name={user?.firstName}
        guide={" Monitor all books and material in your library"}
      />
      <Stat title={"Books Read"} stat={myBooks} />
      <Stat title={"Pages Covered"} stat={pagesRead} />
      <Stat title={"Days to Exam"} stat={20} />
    </div>
  );
};
export default Stats;
