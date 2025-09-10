"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";

const images = [
  "/pic-1.jpg",
  "/pic-2.jpg",
  "/pic-3.jpg",
  "/pic-4.jpg",
  "/pic-5.jpg",
  "/pic-6.jpg",
];

export default function Page() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [currentImage, setCurrentImage] = useState(0);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => {
        let next;
        do {
          next = Math.floor(Math.random() * images.length);
        } while (next === prev);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Delay animation until Clerk SignIn is ready
  useEffect(() => {
    const checkClerkLoaded = setTimeout(() => {
      setShowForm(true); // simulate delay for Clerk load
    }, 400);
    return () => clearTimeout(checkClerkLoaded);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f9f6f1] dark:bg-zinc-900">
      {/* {images.map((src, index) => (
        <Image
          key={index}
          src={src}
          alt="Background"
          fill
          className={clsx(
            "object-cover transition-opacity duration-1000 ease-in-out",
            index === currentImage ? "opacity-100" : "opacity-0"
          )}
          priority={index === 0}
        />
      ))} */}

      {/* <div className="absolute inset-0 bg-black/50 dark:bg-black/50 z-10" /> */}

      <div className="relative z-20 flex items-center justify-center min-h-screen">
        {isLoaded ? (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 10,
              mass: 0.75,
              delay: 0.1,
            }}
            className="shadow-xl rounded-xl p-8 w-fit mx-4"
          >
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#016630",
                  colorText: "#111111",
                  borderRadius: "12px",
                  colorBackground: "transparent",
                },
                elements: {
                  headerTitle: "hidden",
                  footerTitle: "hidden",
                  logoBox: "flex justify-center my-4",
                  logoImage: "h-56 w-auto",
                  card: "bg-transparent shadow-none border-none rounded-xl",
                  socialButtonsBlockButton: "dark:!text-white",
                  dividerText: "dark:!text-white font-poppins",
                  dividerLine: "dark:!bg-zinc-200",
                  formFieldLabel: "dark:!text-white",
                  formFieldInput:
                    "!bg-zinc-100 dark:!bg-zinc-700 border !border-zinc-300 dark:!border-zinc-600 !text-black dark:!text-white !placeholder-zinc-400 dark:!placeholder-zinc-400",
                  formButtonPrimary:
                    "bg-[#064E3B] hover:bg-emerald-950 text-white font-semibold",
                  headerSubtitle:
                    "font-poppins font-medium text-xs !text-zinc-700 dark:!text-zinc-300 mb-2",
                  footerActionText: "!text-zinc-400",
                  footerActionLink:
                    "!text-emerald-600 dark:!text-emerald-400 hover:!text-emerald-800 dark:hover:!text-emerald-200 underline",
                },
              }}
            />
          </motion.div>
        ) : (
          <div className="flex bg-white dark:bg-zinc-800 h-screen w-full justify-center items-center animate-fade-in col-span-3">
            <img
              src="/univault.png"
              alt="Loading UniVault..."
              className="h-20 w-auto animate-pulse mb-4"
            />
          </div>
        )}
      </div>

      <footer className="absolute bottom-6 font-poppins w-full text-center text-xs text-zinc-600 dark:text-zinc-400 z-20">
        © {new Date().getFullYear()} UniVault. All rights reserved.
      </footer>
    </div>
  );
}
