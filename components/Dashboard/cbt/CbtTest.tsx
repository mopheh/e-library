import CbtSidebar from "./CbtSidebar";
import CbtQuestion from "./CbtQuestion";
import CbtTimer from "./CbtTimer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CbtTest({
  questions,
  answers,
  onAnswer,
  onSubmit,
}: any) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-full space-y-4">
        {/* Header / Top Bar for Mobile */}
        <div className="flex items-center justify-between lg:hidden p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
             <span className="text-sm font-medium">Question {currentIdx + 1} of {questions.length}</span>
             <Sheet>
                 <SheetTrigger asChild>
                     <Button variant="ghost" size="icon">
                         <Menu className="h-5 w-5" />
                     </Button>
                 </SheetTrigger>
                 <SheetContent side="left" className="w-[80vw] sm:w-[350px] p-0">
                     <div className="h-full py-4 px-2 overflow-y-auto">
                        <CbtSidebar
                            questions={questions}
                            currentIdx={currentIdx}
                            onNavigate={setCurrentIdx}
                            answers={answers}
                        />
                     </div>
                 </SheetContent>
             </Sheet>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full h-full">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block lg:col-span-3 border-r pr-4 h-full overflow-y-auto border-zinc-200 dark:border-zinc-800">
          <CbtSidebar
            questions={questions}
            currentIdx={currentIdx}
            onNavigate={setCurrentIdx}
            answers={answers}
          />
        </div>

        {/* Main Content */}
        <div className="col-span-1 lg:col-span-9 flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-full sm:w-auto flex-1 mr-4">
                     <div className="flex justify-between text-xs text-zinc-500 mb-2">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                     </div>
                     <Progress value={progress} className="h-2" />
                </div>
                <CbtTimer />
            </div>

          <div className="flex-1">
            <CbtQuestion
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onAnswer={(opt: string) => onAnswer(currentQuestion.id, opt)}
            />
          </div>

          <div className="flex justify-between mt-auto pt-4">
            <Button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              variant="outline"
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            {currentIdx < questions.length - 1 ? (
              <Button onClick={() => setCurrentIdx((i) => i + 1)} className="gap-2">
                  Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
