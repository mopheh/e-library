"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[#0e0e0e] border-t border-white/5 pt-20 pb-10 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Main CTA inside Footer to save space */}
        <div className="mb-32 text-center">
          <h2 className="font-manrope text-4xl md:text-5xl font-bold text-white mb-8">
            Study With Structure.<br />Perform With Confidence.
          </h2>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-[#0066FF] hover:bg-[#005cbb] text-white font-inter font-medium transition-transform hover:scale-[1.02]">
            Start Using UniVault
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 border-t border-white/5 pt-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-manrope text-2xl font-bold tracking-tight text-white flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              UniVault
            </Link>
            <p className="font-inter text-sm text-[#8c90a1] max-w-xs">
              The premier digital academic platform designed for higher education institutions.
            </p>
          </div>
          
          <div>
            <h4 className="font-manrope text-white font-semibold mb-4">Product</h4>
            <ul className="flex flex-col gap-3 font-inter text-sm text-[#8c90a1]">
              <li><Link href="#" className="hover:text-white transition-colors">Digital Library</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Study Assistant</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">CBT Prep</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-manrope text-white font-semibold mb-4">Institution</h4>
            <ul className="flex flex-col gap-3 font-inter text-sm text-[#8c90a1]">
              <li><Link href="#" className="hover:text-white transition-colors">For Universities</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Faculty Tools</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-manrope text-white font-semibold mb-4">Resources</h4>
            <ul className="flex flex-col gap-3 font-inter text-sm text-[#8c90a1]">
              <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 font-inter text-xs text-[#8c90a1]">
          <p>© {new Date().getFullYear()} UniVault. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
