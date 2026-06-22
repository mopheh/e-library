"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "For Aspirants", href: "#preadmission" },
  { label: "How It Works", href: "#howitworks" },
  { label: "Community", href: "#community" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-3 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_40px_rgba(0,0,0,0.4)]"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-lg blur-md group-hover:blur-lg transition-all" />
              <img src="/rcf-logo-full.png" alt="RCF E-Library" className="h-9 w-auto relative" />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-inter text-[#9da8c4] hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-inter font-medium px-4 py-2 rounded-lg text-[#abc7ff] hover:text-white hover:bg-white/5 transition-all"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="relative text-sm font-inter font-semibold px-5 py-2.5 rounded-lg overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0057e7] to-[#0099ff] group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#0057e7]/80 to-[#00c6ff]/80 transition-opacity" />
                  <span className="relative text-white">Get Started Free</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[64px] inset-x-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-6 flex flex-col gap-2 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-inter text-[#c2c6d8] hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-white/5">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-lg bg-gradient-to-r from-[#0057e7] to-[#0099ff] text-white text-sm font-inter font-semibold">
                    Get Started Free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="block w-full py-3 text-center rounded-lg bg-white/5 text-white text-sm font-inter font-semibold">
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
