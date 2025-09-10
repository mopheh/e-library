"use client";
import CbtSidebar from "./CbtSidebar";
import CbtQuestion from "./CbtQuestion";
import CbtTimer from "./CbtTimer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CbtTest({
  questions,
  answers,
  onAnswer,
  onSubmit,
}: any) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentQuestion = questions[currentIdx];
  console.log();

  return (
    <div className="grid grid-cols-12 gap-4 w-full h-full">
      {/* Sidebar */}
      <div className="col-span-3 border-r pr-2">
        <CbtSidebar
          questions={questions}
          currentIdx={currentIdx}
          onNavigate={setCurrentIdx}
          answers={answers}
        />
      </div>

      {/* Main Content */}
      <div className="col-span-9 flex flex-col space-y-4">
        <CbtTimer />
        <CbtQuestion
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={(opt: string) => onAnswer(currentQuestion.id, opt)}
        />
        <div className="flex justify-between mt-4">
          <Button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => i - 1)}
            variant="outline"
          >
            Previous
          </Button>
          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx((i) => i + 1)}>Next</Button>
          ) : (
            <Button
              onClick={onSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
