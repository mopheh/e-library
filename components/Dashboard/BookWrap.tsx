import React, { useEffect, useState } from "react"
import Image from "next/image"
import NoBookWrap from "@/components/NoBookWrap"
import { getRecentlyViewedBooks } from "@/lib/utils"
import ViewedBook from "@/components/Dashboard/ViewedBook"
import Charts from "./Charts"
import { useIsDarkMode } from "../is-dark"

function BookWrap() {
  const isDark = useIsDarkMode()
  const [books, setBooks] = useState([])
  useEffect(() => {
    const books = getRecentlyViewedBooks()
    setBooks(books)
  }, [])

  return (
      <div className="flex flex-col lg:flex-row w-full gap-4 sm:px-2">
        {/* Charts Section */}
        <div className="bg-white dark:bg-gray-950 rounded-lg w-full lg:w-1/2 p-3 h-[400px] relative overflow-hidden font-poppins">
          <h3 className="text-base font-semibold mb-4 font-open-sans">
            Reading Activity (Last 7 Days)
          </h3>
          <Charts />
        </div>

        {/* Recently Viewed Section */}
        <div className="bg-white dark:bg-gray-950 rounded-lg w-full lg:w-1/2 p-3 h-[400px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold font-open-sans">Recently Viewed</h3>
            <button className="bg-gray-50 dark:bg-gray-800 text-xs cursor-pointer text-green-500 px-3 py-2 text-open-sans font-poppins rounded-lg">
              View All
            </button>
          </div>
          <div className="flex gap-2 flex-col">
            {books.length !== 0 ? (
                books.map((book: { id: string }) => (
                    <ViewedBook key={book.id} book={book} />
                ))
            ) : (
                <>
                  <div className="w-full h-full flex justify-center items-center">
                    <Image
                        src={"/icons/empty-book.svg"}
                        alt={"empty-book"}
                        width={250}
                        height={200}
                    />
                  </div>
                  <div className="font-poppins">
                    <h4 className="text-center mb-1 font-open-sans font-semibold text-gray-800 dark:text-gray-100">
                      No Books Viewed
                    </h4>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      You haven’t viewed any books yet. Start exploring.
                    </p>
                  </div>
                </>
            )}
          </div>
          <div className="w-full h-fit absolute left-0 bottom-0">
            <Image
                src={`/icons/${isDark ? "Gradient-Dark.svg" : "gradient.svg"}`}
                alt={"gradient"}
                width={600}
                height={100}
            />
          </div>
        </div>
      </div>
  )
}

export default BookWrap
