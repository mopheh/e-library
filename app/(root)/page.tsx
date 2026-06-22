import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PreAdmissionHub } from "@/components/landing/PreAdmissionHub";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExpansionVision } from "@/components/landing/ExpansionVision";
import { WhyRCF } from "@/components/landing/WhyRCF";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "RCF E-Library — Your Complete Academic Study Hub",
  description:
    "RCF E-Library is the all-in-one academic platform for university students. AI-powered study tools, a structured digital library, real-time collaboration, exam practice, and career opportunities — all in one place.",
};

export default function LandingPage() {
  return (
    <main className="dark bg-[#0a0a0f] text-[#e5e2e1] min-h-screen selection:bg-[#0057e7] selection:text-white font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <PreAdmissionHub />
      <ComparisonSection />
      <HowItWorks />
      <ExpansionVision />
      <WhyRCF />
      <Footer />
    </main>
  );
}
