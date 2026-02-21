"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const { data: courses, isLoading: coursesLoading } = useCbtCourses(); // Added isLoading

  const handleStart = () => setStage("test");

  const handleAnswer = (questionId: number, optionText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };

  // Reset state when starting fresh
  const handleSetupStart = (data: any) => {
      // 1. Slice questions according to `numQuestions` randomly or from the top.
      const selectedQuestions = [...(data.course.questions || [])]
          .sort(() => 0.5 - Math.random())
          .slice(0, data.numQuestions);

      setSetupData({
          ...data,
          course: {
              ...data.course,
              questions: selectedQuestions,
          }
      });
      setAnswers({});
      setScore(0);
      setStage("instructions");
  }

  const handleSubmit = async () => {
    if (!setupData?.course?.questions || isSubmitting) return;
    
    setIsSubmitting(true);
    let newScore = 0;
    const questions = setupData.course.questions;
    
    const userAnswers: any[] = [];

    questions.forEach((q: any) => {
      const correctOpt = q.options.find((o: any) => o.isCorrect);
      const isCorrect = answers[q.id] === correctOpt?.optionText;
      if (isCorrect) {
        newScore++;
      }

      // Find the ID of the option the user actually selected
      const selectedOpt = q.options.find((o: any) => o.optionText === answers[q.id]);

      userAnswers.push({
        questionId: q.id,
        selectedOptionId: selectedOpt?.id,
        isCorrect
      });
    });

    try {
        const response = await fetch("/api/cbt/sessions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                courseId: setupData.course.id,
                score: newScore,
                userAnswers,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to submit assessment result");
        }

        setScore(newScore);
        setStage("result");
    } catch (error) {
        console.error("Submission error:", error);
        toast.error("Failed to save your score. Please check your connection.");
    } finally {
        setIsSubmitting(false);
        setShowSubmit(false);
    }
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
            loading={isSubmitting}
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
