"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export interface CbtCourse {
  id: string;
  name: string;
  questionCount: number;
  questions?: any[];
}

interface CbtSetupProps {
  courses: CbtCourse[];
  onStart: (data: any) => void;
  loading?: boolean;
}

export default function CbtSetup({ courses, onStart, loading }: CbtSetupProps) {
  const [courseId, setCourseId] = useState("");
  const [numQuestions, setNumQuestions] = useState(20);
  const [duration, setDuration] = useState(30);

  const selectedCourse = courses?.find((c) => c.id === courseId); // Fixed optional chaining
  const maxQuestions = selectedCourse?.questionCount || 0;

  if (loading) {
      return (
          <Card className="w-full max-w-lg mx-auto p-6 rounded-2xl shadow font-poppins">
              <CardContent className="space-y-4">
                  <div className="h-6 w-1/3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                  <div className="space-y-2">
                       <div className="h-4 w-1/4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                       <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                  </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="w-full max-w-lg mx-auto p-6 rounded-2xl shadow font-poppins bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
      <CardContent className="space-y-6">
        <div className="space-y-1">
            <h2 className="text-xl font-semibold font-cabin tracking-tight text-zinc-900 dark:text-zinc-100">
            Start Assessment
            </h2>
            <p className="text-xs font-poppins text-zinc-500 dark:text-zinc-400">Configure your test parameters below.</p>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
            <label className="text-xs font-medium font-poppins text-zinc-700 dark:text-zinc-300">Select Course</label>
            <Select
                onValueChange={(val) => {
                setCourseId(val);
                setNumQuestions(5);
                }}
            >
                <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                {courses?.map((c) => (
                    <SelectItem className="text-xs font-poppins" key={c.id} value={c.id}>
                    {c.name} <span className="text-zinc-400  ml-1">({c.questionCount} questions)</span>
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </div>

            {selectedCourse && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Number of Questions</label>
                    <span className="text-xs text-zinc-500">Max: {maxQuestions}</span>
                </div>
                <input
                type="number"
                min={1}
                max={maxQuestions}
                value={numQuestions}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > maxQuestions) setNumQuestions(maxQuestions);
                    else setNumQuestions(val);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            )}

            <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duration (minutes)</label>
             <input
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            </div>
        </div>

        <Button
          className="w-full font-medium"
          size="lg"
          disabled={!courseId || numQuestions < 1 || numQuestions > maxQuestions}
          onClick={() =>
            selectedCourse &&
            onStart({
              course: selectedCourse,
              numQuestions,
              duration,
            })
          }
        >
          Start Test
        </Button>
      </CardContent>
    </Card>
  );
}
