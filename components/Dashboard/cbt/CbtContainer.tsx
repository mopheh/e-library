"use client";
import { useEffect, useState } from "react";
import CbtInstructions from "./CbtInstructions";
import CbtTest from "./CbtTest";
import CbtSubmitModal from "./CbtSubmitModal";
import CbtResult from "./CbtResult";
import { useCbtCourses } from "@/hooks/useCourses";
import CbtSetup from "@/components/Dashboard/cbt/CbtSetup";

  // const sampleQuestions = ... (removed)

export default function CbtContainer() {
  const [setupData, setSetupData] = useState<any>(null);
  const [stage, setStage] = useState<
    "setup" | "instructions" | "test" | "result"
  >("setup");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({}); // Changed key to string to match question ID type if needed, or keep number if IDs are numbers
  const [showSubmit, setShowSubmit] = useState(false);
  const [score, setScore] = useState(0);
  const { data: courses, isLoading: coursesLoading } = useCbtCourses(); // Added isLoading

  const handleStart = () => setStage("test");

  const handleAnswer = (questionId: number, optionText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };

  // Reset state when starting fresh
  const handleSetupStart = (data: any) => {
      setSetupData(data);
      setAnswers({});
      setScore(0);
      setStage("instructions");
  }

  const handleSubmit = () => {
    if (!setupData?.course?.questions) return;
    
    let newScore = 0;
    const questions = setupData.course.questions;
    
    questions.forEach((q: any) => {
      const correctOpt = q.options.find((o: any) => o.isCorrect);
      // Ensure specific comparison, trim strings if necessary
      if (answers[q.id] === correctOpt?.optionText) {
        newScore++;
      }
    });
    setScore(newScore);
    setStage("result");
    setShowSubmit(false);
  };

  return (
    <div className="w-full h-full p-6">
      {stage === "instructions" && <CbtInstructions onStart={handleStart} />}
      {stage === "setup" && (
        <CbtSetup
          courses={courses}
          loading={coursesLoading}
          onStart={handleSetupStart}
        />
      )}
      {stage === "test" && setupData && (
        <>
          <CbtTest
            questions={setupData.course.questions}
            answers={answers}
            onAnswer={handleAnswer}
            onSubmit={() => setShowSubmit(true)}
            duration={setupData.duration} 
          />
          <CbtSubmitModal
            open={showSubmit}
            onConfirm={handleSubmit}
            onCancel={() => setShowSubmit(false)}
          />
        </>
      )}

      {stage === "result" && (
        <CbtResult 
            score={score} 
            total={setupData?.course?.questions?.length || 0} 
            onRetry={() => setStage("setup")}
        />
      )}
    </div>
  );
}
