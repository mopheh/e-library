import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import Stat from "@/components/Dashboard/Stat"
import Welcome from "@/components/Welcome"
import { useMyBooks } from "@/hooks/useBooks"
import { useReadingSession } from "@/hooks/useUsers"
import {
  HiOutlineBookOpen,
  HiOutlineDocumentText,
  HiOutlineCalendar,
} from "react-icons/hi"

const Stats = () => {
  const { user } = useUser()
  const [pagesRead, setPagesRead] = useState(0)
  const { data: myBooks } = useMyBooks()
  const { data } = useReadingSession()
  useEffect(() => {
    if (data) {
      const books = data.reduce(
        (sum: any, book: { pagesRead: any }) => sum + book.pagesRead,
        0
      )
      setPagesRead(books)
    }
  }, [data])
  return (
    <div className="flex gap-8 my-10">
      <Welcome
        name={user?.firstName}
        guide={" Monitor all books and material in your library"}
      />
      <Stat
        title="Books Read"
        stat={myBooks}
        icon={<HiOutlineBookOpen />}
        color="text-green-600"
        bgColor="bg-green-50"
      />

      <Stat
        title="Pages Covered"
        stat={pagesRead}
        icon={<HiOutlineDocumentText />}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />

      <Stat
        title="Days to Exam"
        stat={20}
        icon={<HiOutlineCalendar />}
        color="text-red-600"
        bgColor="bg-red-50"
      />
    </div>
  )
}
export default Stats
