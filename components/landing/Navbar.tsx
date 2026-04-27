"use client";

import React from "react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";

export const Navbar = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-50 py-4 px-6 md:px-12 bg-[#131313]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-manrope text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          UniVault
        </Link>
        
        <nav className="hidden md:flex gap-8 text-sm font-inter text-[#c2c6d8]">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#preadmission" className="hover:text-white transition-colors">Aspirants</Link>
          <Link href="#institution" className="hover:text-white transition-colors">Institution</Link>
        </nav>

        <div className="flex flex-row items-center gap-4">
          <SignedIn>
            <Link href="/dashboard" className="text-sm font-inter font-medium text-white hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-inter font-medium px-4 py-2 rounded-md bg-[#0066FF] text-white hover:bg-[#005cbb] transition-all">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </motion.header>
  );
};
