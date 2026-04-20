import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PreAdmissionHub } from "@/components/landing/PreAdmissionHub";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExpansionVision } from "@/components/landing/ExpansionVision";
import { WhyUniVault } from "@/components/landing/WhyUniVault";
import { Footer } from "@/components/landing/Footer";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="dark bg-[#131313] text-[#e5e2e1] min-h-screen selection:bg-[#2b70d0] selection:text-white font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <PreAdmissionHub />
      <FeaturesSection />
      <ComparisonSection />
      <HowItWorks />
      <ExpansionVision />
      <WhyUniVault />
      <Footer />
    </main>
  );
}
