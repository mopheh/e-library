import React, { useEffect, useState } from "react";
import Image from "next/image";
import NoBookWrap from "@/components/NoBookWrap";
import { getRecentlyViewedBooks } from "@/lib/utils";
import ViewedBook from "@/components/Dashboard/ViewedBook";
import Charts from "./Charts";

function BookWrap() {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    const books = getRecentlyViewedBooks();
    setBooks(books);
  }, []);
  return (
    <div className="flex w-full gap-4 px-2">
      <div className="bg-white rounded-lg w-1/2 p-3 h-[400px] relative overflow-hidden font-poppins">
        <h3 className="text-base font-semibold mb-4 font-open-sans">
          Reading Activity (Last 7 Days)
        </h3>
        <Charts />
      </div>
      <div className="bg-white rounded-lg w-1/2 p-3 h-[400px] relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold  font-open-sans">Recently Viewed</h3>
          <button className="bg-gray-50 text-xs cursor-pointer text-green-500 px-3 py-2 text-open-sans font-poppins rounded-lg">
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
                <h4 className="text-center mb-1 font-open-sans font-semibold text-gray-800">
                  No Books Viewed
                </h4>
                <p className="text-center text-xs text-gray-500 mt-1">
                  You haven’t viewed any books yet. Start exploring.
                </p>
              </div>
            </>
          )}
        </div>
        <div
          className="w-full h-fit absolute bottom-[0]
        "
        >
          <Image
            src={"/icons/gradient.svg"}
            alt={"gradient"}
            width={600}
            height={100}
          />
        </div>
      </div>

      {/*<NoBookWrap*/}
      {/*  name={"Saved Books"}*/}
      {/*  title={"No saved books"}*/}
      {/*  message={*/}
      {/*    "You haven’t saved any books yet. Start exploring and bookmark your favorites."*/}
      {/*  }*/}
      {/*/>*/}
    </div>
  );
}

export default BookWrap;
