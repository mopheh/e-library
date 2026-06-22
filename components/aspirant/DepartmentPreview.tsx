"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookA,
  PlayCircle,
  FileText,
  Lock,
  Users,
  Star,
  ArrowRight,
  GraduationCap,
  Loader2,
} from "lucide-react";
import UpgradePromptModal from "./UpgradePromptModal";
import Link from "next/link";
import { getDepartmentPreview } from "@/actions/preview";
import { useUserData } from "@/hooks/useUsers";

type PreviewData = {
  stats: { recommendedTexts: number; pastQuestions: number; currentStudents: number };
  department: { name: string; id: string; facultyId: string | null };
  coreCourses: string[];
};

export default function DepartmentPreview({ targetDepartmentId }: { targetDepartmentId?: string }) {
  const { data: userData } = useUserData();
  const role = userData?.role?.toLowerCase() || "student";
  const isAspirant = role === "aspirant";
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      if (!targetDepartmentId) {
        setLoading(false);
        return;
      }
      const res = await getDepartmentPreview(targetDepartmentId);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    fetchPreview();
  }, [targetDepartmentId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // No department configured yet
  if (!targetDepartmentId || !data) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col items-center justify-center text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold font-open-sans mb-3">No Department Selected Yet</h2>
          <p className="text-zinc-500 mb-6">
            You haven&apos;t linked an intended department to your profile. Start by submitting your verification request — that&apos;s where you select the department you were admitted into.
          </p>
          <Link href="/verify">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors flex items-center gap-2 mx-auto">
              Submit Verification <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Recommended Texts", value: data.stats.recommendedTexts, icon: BookA },
    { label: "Past Questions", value: `${data.stats.pastQuestions}+`, icon: FileText },
    { label: "Current Students", value: data.stats.currentStudents, icon: Users },
  ];

  const coreCourses =
    data.coreCourses.length > 0
      ? data.coreCourses
      : ["General Physics I", "General Mathematics I", "General Chemistry I", "Use of English"];

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins space-y-8">

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 text-white p-8 md:p-12 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-zinc-900 to-black" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-medium mb-6">
              <Star className="w-4 h-4" /> You are aspiring for
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-open-sans mb-4 leading-tight">
              {data.department.name}
            </h1>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg leading-relaxed">
              Discover the future of your field. Get a sneak peek into your first year at the university.
            </p>
            <div className="flex gap-4">
              <Link href="/connect">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  Connect with Students <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm text-center">
                <s.icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col */}
        <div className="lg:col-span-2 space-y-8">

          {/* Course Overview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800"
          >
            <h2 className="text-2xl font-bold mb-6 font-open-sans">
              Core 100-Level Courses
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {coreCourses.map((sub: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  {sub}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Locked Sections */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-open-sans">Premium Department Resources</h3>

            {[
              { title: "First Semester Lecture Notes", count: data.stats.recommendedTexts, icon: FileText },
              { title: "Mocks and Past Questions", count: data.stats.pastQuestions, icon: BookA },
              { title: "Introductory Video Lectures", count: 8, icon: PlayCircle },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="relative group overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 flex items-center justify-between cursor-pointer"
                onClick={() => isAspirant ? setShowUpgradeModal(true) : undefined}
              >
                <div className="flex items-center gap-4 z-0">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{item.title}</h4>
                    <span className="text-sm text-zinc-500">{item.count} items included</span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  {isAspirant ? <Lock className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-700 h-full relative overflow-hidden">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Users className="text-blue-600 w-5 h-5" /> Voices from the Dept
            </h3>

            <div className="space-y-4 relative z-10">
              {[
                { name: "Chinedu Okafor", level: "400 Level", msg: "Focus heavily on foundational courses — it's the bedrock for what comes next!" },
                { name: "Amina Musa", level: "200 Level", msg: "Consistent practice takes you further. Don't leave it until exam week." },
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                      {s.level}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">&quot;{s.msg}&quot;</p>
                </div>
              ))}

              {isAspirant ? (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full py-4 mt-4 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-zinc-500 dark:text-zinc-400 font-medium hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> View full directory
                </button>
              ) : (
                <Link
                  href="/connect"
                  className="w-full py-4 mt-4 border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400 font-medium hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" /> View full directory
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
