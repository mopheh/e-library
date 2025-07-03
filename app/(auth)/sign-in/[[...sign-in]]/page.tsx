"use client";
import React, { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";

const Page = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1000); // Delay to simulate load
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className={" h-screen w-full items-center grid grid-cols-3 gap-8"}>
      {!ready ? (
        <div className="flex w-full justify-center items-center animate-fade-in col-span-3">
          <img
            src="/univault.png"
            alt="Loading UniVault..."
            className="h-20 w-auto animate-pulse mb-4"
          />
        </div>
      ) : (
        <>
          <div className="pl-16">
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#1E3A8A", // UniVault deep blue
                  colorText: "#1F2937", // Charcoal
                  borderRadius: "8px",
                },
                elements: {
                  headerTitle: "hidden",
                  headerSubtitle: "font-poppins font-medium text-xs",
                  footerTitle: "hidden",
                  card: "bg-transparent shadow-none border-none",
                  formButtonPrimary:
                    "bg-[#1E3A8A] hover:bg-blue-900 text-white",
                  logoBox: "flex justify-center mb-4",
                  logoImage: "h-56 w-auto",
                },
              }}
            />
          </div>
          <div className="col-span-2 h-screen w-full relative">
            <div className={"w-full h-screen bg-pattern"}></div>
            <div className="w-full z-10 flex flex-col h-full justify-between backdrop-blur-sm absolute top-0 right-0 p-10">
              <div className="text-white text-right mt-10">
                <h1 className="mb-0 font-cabin text-5xl font-bold">
                  Welcome Back.
                </h1>
                <p className="welcome-text m-0 font-poppins text-sm  ">
                  "Unlocking Knowledge, Empowering Minds: Your Gateway to
                  Lifelong Learning"
                </p>
              </div>
              <div>
                <div className="flex pr-5 pb-5 justify-end items-center">
                  <span className="pr-3 text-gray-700 font-medium text-xs font-poppins">
                    Need Help?
                  </span>{" "}
                  <button className="rounded-lg bg-white font-poppins text-xs px-5 py-3">
                    Get Help
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};
export default Page;
