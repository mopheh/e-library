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

interface Course {
  id: string;
  name: string;
  questionCount: number;
}

interface CbtSetupProps {
  courses: Course[];
  onStart: (data: any) => void;
}

export default function CbtSetup({ courses, onStart }: CbtSetupProps) {
  const [courseId, setCourseId] = useState("");
  const [numQuestions, setNumQuestions] = useState(20);
  const [duration, setDuration] = useState(30);

  const selectedCourse = courses && courses.find((c) => c.id === courseId);
  const maxQuestions = selectedCourse?.questionCount || 0;

  return (
    <Card className="w-full max-w-lg mx-auto p-6 rounded-2xl shadow font-poppins">
      <CardContent className="space-y-4">
        <h2 className="text-lg font-normal font-josefin-sans uppercase tracking-tighter">
          Start a CBT Test
        </h2>

        <div>
          <label className="text-sm font-normal">Select Course</label>
          <Select
            onValueChange={(val) => {
              setCourseId(val);
              setNumQuestions(5);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((c) => (
                <SelectItem className="text-xs" key={c.id} value={c.id}>
                  {c.name} ({c.questionCount} questions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourse && (
          <div>
            <label className="text-sm font-normal">Number of Questions</label>
            <input
              type="number"
              min={5}
              max={maxQuestions}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="border text-xs rounded-md w-full p-2 mt-1"
            />
            <p className="text-[10px] text-emerald-500">
              Available: {maxQuestions} questions
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-normal">Duration (minutes)</label>
          <input
            type="number"
            min={5}
            max={180}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border text-xs rounded-md w-full p-2 mt-1"
          />
        </div>

        <Button
          className="w-full font-light text-xs"
          disabled={!courseId || numQuestions > maxQuestions}
          onClick={() =>
            selectedCourse &&
            onStart({
              course: selectedCourse,
              numQuestions,
              duration,
            })
          }
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
