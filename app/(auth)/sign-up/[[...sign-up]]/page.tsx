import { SignUp } from "@clerk/nextjs";
import React from "react";

const page = () => (
  <main
    className={
      "h-screen flex flex-col items-center bg-cover justify-center gap-10 relative"
    }
  >
    <div className={"fixed inset-0 w-screen h-screen  backdrop-blur-sm"}></div>
    <SignUp />
  </main>
);
//flex-col items-center justify-center gap-10
export default page;
