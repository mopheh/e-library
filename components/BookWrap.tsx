import React from "react";
import Image from "next/image";
import NoBookWrap from "@/components/NoBookWrap";

function BookWrap() {
  return (
    <div className="flex w-[98%] gap-4 px-2">
      <NoBookWrap
        name={"Recently Viewed"}
        title={"No book viewed"}
        message={"You haven't viewed any books yet."}
      />
      <NoBookWrap
        name={"Saved Books"}
        title={"No saved books"}
        message={
          "You haven’t saved any books yet. Start exploring and bookmark your favorites."
        }
      />
    </div>
  );
}

export default BookWrap;
