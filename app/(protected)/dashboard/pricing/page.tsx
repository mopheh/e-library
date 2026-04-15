"use client";

import React from "react";
import { Check, Sparkles, GraduationCap, Award, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "The Scholar",
    price: "Free",
    description: "Standard resources for every student on campus.",
    icon: <GraduationCap className="w-8 h-8 text-blue-600" />,
    features: [
      "Standard Library Access",
      "5 AI Tutor Requests / Day",
      "Community Discussion Access",
      "Public Study Rooms",
    ],
    cta: "Current Plan",
    featured: false,
    color: "bg-blue-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800",
  },
  {
    name: "The Academic",
    price: "₦2,500",
    period: "/ semester",
    description: "Unlock downloads and advanced study tools.",
    icon: <Award className="w-8 h-8 text-emerald-600" />,
    features: [
      "Offline Downloads Enabled",
      "50 AI Tutor Requests / Day",
      "Exclusive Study Materials",
      "Private Study Room Host",
      "Priority Support",
    ],
    cta: "Upgrade to Academic",
    featured: true,
    color: "bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-800 ring-4 ring-emerald-500/5",
  },
  {
    name: "Dean's List",
    price: "₦5,000",
    period: "/ semester",
    description: "The ultimate premium experience for high achievers.",
    icon: <Sparkles className="w-8 h-8 text-amber-600" />,
    features: [
      "Unlimited AI Tutor",
      "Unlimited Downloads",
      "Full CBT Mock Access",
      "AI Mock Exam Analysis",
      "Senior Mentorship (Connect)",
      "Early Access to Features",
    ],
    cta: "Join Dean's List",
    featured: false,
    color: "bg-zinc-900 text-white border-zinc-800 shadow-2xl shadow-blue-500/10",
  },
];

export default function PricingPage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-12 min-h-screen premium-bg font-poppins">
      <div className="max-w-6xl mx-auto space-y-16">
        
        <div className="text-center space-y-6">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-semibold"
          >
             <Sparkles className="w-3 h-3" /> Premium Membership
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Level up your <span className="text-blue-600">Learning</span>
          </motion.h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            Choose a plan that fits your academic goals. Everyone starts as a Scholar, but the Dean's List is for those who want total dominance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col p-8 rounded-[2rem] border shadow-sm transition-all hover:shadow-xl group ${plan.color}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                   <Zap className="w-3 h-3 fill-white" /> Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${plan.featured ? "bg-emerald-50" : "bg-zinc-50 dark:bg-zinc-800"}`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-xs leading-relaxed ${plan.name === "Dean's List" ? "text-zinc-400" : "text-zinc-500"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-sm opacity-60"> {plan.period}</span>}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.name === "Dean's List" ? "bg-white/10 text-white" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600"}`}>
                       <Check className="w-3 h-3 stroke-[3px]" />
                    </div>
                    <span className="text-sm opacity-90 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/dashboard" className="mt-auto">
                <button 
                  className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md ${
                    plan.featured 
                      ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                      : plan.name === "Dean's List"
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 shadow-transparent"
                  }`}
                >
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center pt-8">
           <Link href="/dashboard" className="text-sm font-semibold text-zinc-400 hover:text-blue-600 transition-colors">
              Back to Dashboard
           </Link>
        </div>
      </div>
    </div>
  );
}
