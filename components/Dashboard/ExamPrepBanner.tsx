"use client";

import React from "react";
import { Timer, BookOpen, BrainCircuit, ChevronRight } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ExamCourse {
  id: string;
  courseCode: string;
  title: string;
  examDate: string | Date | null;
}

export const ExamPrepBanner = ({ courses }: { courses: ExamCourse[] }) => {
  // Find the closest upcoming exam within 14 days
  const upcomingExams = courses
    .filter((c) => c.examDate)
    .map((c) => ({
      ...c,
      daysToExam: differenceInDays(new Date(c.examDate!), new Date()),
    }))
    .filter((c) => c.daysToExam >= 0 && c.daysToExam <= 14)
    .sort((a, b) => a.daysToExam - b.daysToExam);

  if (upcomingExams.length === 0) {
    return null;
  }

  const closest = upcomingExams[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 p-6 text-white shadow-lg mb-6 shadow-red-500/20">
      {/* Background Decorative Pattern */}
      <div className="absolute right-0 top-0 -mt-16 -mr-16 opacity-10 blur-2xl">
        <BrainCircuit className="h-64 w-64" />
      </div>

      <div className="relative z-10 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-white/20 p-3 backdrop-blur-md">
            <Timer className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-900/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-red-50 backdrop-blur-sm border border-red-400/30">
                Exam Prep Mode Activated
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold font-poppins leading-tight">
              {closest.courseCode} Exam in {closest.daysToExam} {closest.daysToExam === 1 ? 'Day' : 'Days'}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-red-100 font-open-sans">
              It's time to heavily focus on {closest.title}. Access AI mock exams, past questions, and smart flashcards to guarantee your success.
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 md:w-auto sm:flex-row">
          <Link href={`/dashboard/courses/${closest.id}?tab=quizzes`} className="w-full md:w-auto">
            <Button
              variant="secondary"
              className="w-full bg-white text-red-600 hover:bg-red-50 shadow-sm border-0 font-bold"
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              Generate Mock Exam
            </Button>
          </Link>
          <Link href={`/dashboard/courses/${closest.id}`} className="w-full md:w-auto">
            <Button
              variant="outline"
              className="w-full border-red-300 text-white hover:bg-red-700/50 bg-transparent"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Review Materials
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
