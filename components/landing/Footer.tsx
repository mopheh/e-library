"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

const footerLinks = {
  "Study Tools": [
    { label: "Digital Library", href: "#features" },
    { label: "AI Study Tutor", href: "#features" },
    { label: "Exam Practice", href: "#features" },
    { label: "Study Rooms", href: "#features" },
    { label: "Lecture Recorder", href: "#features" },
    { label: "Mini Apps", href: "#features" },
  ],
  Community: [
    { label: "Ask Seniors", href: "#features" },
    { label: "Instant Messaging", href: "#features" },
    { label: "Leaderboard", href: "#features" },
    { label: "Course Discussions", href: "#features" },
    { label: "Opportunities Board", href: "#features" },
  ],
  Platform: [
    { label: "For Aspirants", href: "#preadmission" },
    { label: "For Undergrads", href: "#community" },
    { label: "For Course Reps", href: "#community" },
    { label: "For Departments", href: "#community" },
    { label: "For Institutions", href: "#institution" },
  ],
};

export const Footer = () => {
  return (
    <footer className="relative bg-[#060609] overflow-hidden">
      {/* Divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* CTA Section */}
      <div className="relative py-28 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0f0f1c] to-[#080810] px-8 md:px-16 py-16 text-center overflow-hidden shadow-[0_0_120px_rgba(0,87,231,0.1)]">
            {/* Decorative glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-blue-500/10 to-transparent" />
              <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-violet-500/10 to-transparent" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/[0.08] mb-8">
                <span className="font-inter text-xs font-medium text-blue-300 uppercase tracking-widest">
                  Free · No Credit Card Required
                </span>
              </div>

              <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                Study with structure.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] via-[#818cf8] to-[#a78bfa]">
                  Perform with confidence.
                </span>
              </h2>

              <p className="font-inter text-[#636e8a] text-lg mb-10 max-w-lg mx-auto">
                Join thousands of students already using RCF E-Library to study smarter, collaborate better, and achieve more.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="group relative px-8 py-4 rounded-xl font-inter font-semibold text-white overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0057e7] to-[#0099ff]" />
                      <span className="relative flex items-center gap-2">
                        Get Started — It&apos;s Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="group relative px-8 py-4 rounded-xl font-inter font-semibold text-white overflow-hidden transition-all hover:scale-[1.02] inline-flex items-center gap-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0057e7] to-[#0099ff]" />
                    <span className="relative flex items-center gap-2">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </SignedIn>
                <Link
                  href="#features"
                  className="px-8 py-4 rounded-xl font-inter font-semibold text-[#8892b0] border border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all"
                >
                  Explore Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-white/[0.05] pt-16 grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
                <img src="/rcf-logo-full.png" alt="RCF E-Library" className="h-9 w-auto" />
              </Link>
              <p className="font-inter text-sm text-[#4a5568] max-w-xs leading-relaxed">
                The premier digital academic platform for university students — from aspirants to graduates.
              </p>
            </div>

            {/* Link Groups */}
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <h4 className="font-manrope text-sm font-bold text-[#8892b0] mb-5">{group}</h4>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-inter text-sm text-[#4a5568] hover:text-[#8892b0] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/[0.05] mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-inter text-xs text-[#2a3444]">
              © {new Date().getFullYear()} RCF E-Library. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="font-inter text-xs text-[#2a3444] hover:text-[#4a5568] transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="font-inter text-xs text-[#2a3444] hover:text-[#4a5568] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
