"use client";

import React from "react";
import Onboarding from "@/components/Onboarding";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950">
      {/* Branding side */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 min-h-screen relative overflow-hidden"
        style={{ background: "#0b1f12" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500/60" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <img src="/rcf-logo-full.png" alt="RCF E-Library" className="h-9 w-auto" />

          <div className="mt-auto mb-auto pt-20">
            <p className="text-emerald-400 text-xs font-inter font-semibold tracking-[0.2em] uppercase mb-5">
              One-time setup
            </p>
            <h2 className="font-manrope text-white text-[2.2rem] font-extrabold leading-[1.18] tracking-tight mb-4">
              Help us personalise<br />your experience.
            </h2>
            <p className="font-inter text-white/50 text-sm leading-relaxed max-w-[300px]">
              This takes under 2 minutes. We use this information to show you the right course materials and features.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { n: "01", t: "Your role", d: "Student or Post-UTME aspirant?" },
                { n: "02", t: "Your academics", d: "Faculty, department, and level" },
                { n: "03", t: "Personal info", d: "Contact and address details" },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex items-start gap-4">
                  <span className="font-manrope text-xs font-bold text-emerald-500/60 mt-0.5 w-6 flex-shrink-0">{n}</span>
                  <div>
                    <p className="font-inter text-sm font-semibold text-white/80">{t}</p>
                    <p className="font-inter text-xs text-white/35 mt-0.5">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="font-inter text-xs text-white/25">
              Your information is encrypted and never shared with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-16 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6">
          <img src="/rcf-logo-full.png" alt="RCF E-Library" className="h-8 w-auto" />
        </div>

        <div className="w-full max-w-xl">
          <Onboarding />
        </div>

        <footer className="absolute bottom-6 text-center">
          <p className="font-inter text-xs text-zinc-400 dark:text-zinc-600">
            © {new Date().getFullYear()} RCF E-Library
          </p>
        </footer>
      </div>
    </div>
  );
}
