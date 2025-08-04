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
    }, 400); // adjust if needed
    return () => clearTimeout(checkClerkLoaded);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f9f6f1]">
      {images.map((src, index) => (
        <Image
          key={index}
          src={src}
          alt="Background"
          fill
          className={clsx(
            "object-cover transition-opacity duration-1000 ease-in-out",
            index === currentImage ? "opacity-100" : "opacity-0",
          )}
          priority={index === 0}
        />
      ))}

      <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-sm" />

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
            className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-xl p-8 w-fit mx-4"
          >
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#016630", // Deep blue for buttons
                  colorText: "#ffffff", // Light text for contrast
                  borderRadius: "12px",
                  colorBackground: "transparent",
                },
                elements: {
                  headerTitle: "hidden",
                  footerTitle: "hidden",
                  logoBox: "flex justify-center my-4",
                  logoImage: "h-56 w-auto",
                  card: "bg-white/10 backdrop-blur-md shadow-none border-none rounded-xl",
                  formFieldInput:
                    "bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60",
                  formButtonPrimary:
                    "bg-[#064E3B] hover:bg-emerald-950 text-white font-semibold",
                  headerSubtitle:
                    "font-poppins font-medium text-xs text-white/80 font-medium mb-2",
                  footerActionText: "text-white/70",
                  footerActionLink:
                    "text-emerald-300 hover:text-white underline",
                },
              }}
            />
          </motion.div>
        ) : (
          <div className="flex bg-white/80 h-screen w-full justify-center items-center animate-fade-in col-span-3">
            <img
              src="/univault.png"
              alt="Loading UniVault..."
              className="h-20 w-auto animate-pulse mb-4"
            />
          </div>
        )}
      </div>

      <footer className="absolute bottom-6 font-poppins w-full text-center text-xs text-white/60 z-20">
        © {new Date().getFullYear()} UniVault. All rights reserved.
      </footer>
    </div>
  );
}
