"use client";
import { useEffect, useState } from "react";
import CbtInstructions from "./CbtInstructions";
import CbtTest from "./CbtTest";
import CbtSubmitModal from "./CbtSubmitModal";
import CbtResult from "./CbtResult";
import { useCbtCourses } from "@/hooks/useCourses";
import CbtSetup from "@/components/Dashboard/cbt/CbtSetup";

const sampleQuestions = [
  {
    id: 1,
    questionText: "What is 2 + 2?",
    options: [
      { optionText: "3", isCorrect: false },
      { optionText: "4", isCorrect: true },
      { optionText: "5", isCorrect: false },
      { optionText: "6", isCorrect: false },
    ],
  },
  {
    id: 2,
    questionText: "What is the capital of France?",
    options: [
      { optionText: "Berlin", isCorrect: false },
      { optionText: "Paris", isCorrect: true },
      { optionText: "Rome", isCorrect: false },
      { optionText: "London", isCorrect: false },
    ],
  },
];

export default function CbtContainer() {
  const [setupData, setSetupData] = useState<any>(null);
  const [stage, setStage] = useState<
    "setup" | "instructions" | "test" | "result"
  >("setup");
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [score, setScore] = useState(0);
  const { data: courses } = useCbtCourses();
  const handleStart = () => setStage("test");

  const handleAnswer = (questionId: number, optionText: string) => {
    console.log(answers);
    setAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };
  useEffect(() => {
    console.log(courses);
    console.log(setupData);
  }, [setupData]);
  const handleSubmit = () => {
    let newScore = 0;
    sampleQuestions.forEach((q) => {
      const correctOpt = q.options.find((o) => o.isCorrect);
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
          onStart={(data) => {
            setSetupData(data);
            setStage("instructions");
          }}
        />
      )}
      {stage === "test" && setupData && (
        <>
          <CbtTest
            questions={setupData.course.questions}
            answers={answers}
            onAnswer={handleAnswer}
            onSubmit={() => setShowSubmit(true)}
          />
          <CbtSubmitModal
            open={showSubmit}
            onConfirm={handleSubmit}
            onCancel={() => setShowSubmit(false)}
          />
        </>
      )}

      {stage === "result" && (
        <CbtResult score={score} total={sampleQuestions.length} />
      )}
    </div>
  );
}
