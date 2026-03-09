"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock Data for UI
const mockQuestions = [
  {
    id: 1,
    subject: "Biology",
    text: "Which of the following blood vessels carries oxygenated blood?",
    options: ["Pulmonary artery", "Pulmonary vein", "Hepatic portal vein", "Vena cava"],
    correctIdx: 1,
    explanation: "The pulmonary vein is the only vein that carries oxygenated blood, moving it from the lungs to the heart.",
  },
  {
    id: 2,
    subject: "English",
    text: "Choose the option that best completes the sentence: The principal, accompanied by the teachers, ____ present at the meeting.",
    options: ["were", "are", "was", "have been"],
    correctIdx: 2,
    explanation: "When a singular subject is connected to other nouns by 'accompanied by', the verb must be singular.",
  },
  {
    id: 3,
    subject: "Physics",
    text: "A body of mass 5kg falls from a height of 10m. Calculate its kinetic energy just before it hits the ground. (g = 10m/s²)",
    options: ["500 J", "50 J", "250 J", "100 J"],
    correctIdx: 0,
    explanation: "Conservation of energy: Potential Energy at the top = Kinetic Energy at the bottom. PE = mgh = 5 * 10 * 10 = 500J.",
  }
];

export default function AspirantCbt() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const currentQ = mockQuestions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / mockQuestions.length) * 100;
  
  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [currentQ.id]: optIdx });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isSubmitted) {
    const score = mockQuestions.reduce((acc, q) => acc + (answers[q.id] === q.correctIdx ? 1 : 0), 0);
    
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex items-center justify-center">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }} 
           animate={{ opacity: 1, scale: 1 }} 
           className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center"
         >
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">
              {score}
            </div>
            <h2 className="text-2xl font-bold mb-2">Exam Completed</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              You scored {score} out of {mockQuestions.length}. Review your answers below.
            </p>

            <div className="text-left space-y-6 max-h-96 overflow-y-auto pr-2">
              {mockQuestions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correctIdx;
                const skipped = answers[q.id] === undefined;
                return (
                  <div key={q.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                    <div className="flex gap-2">
                      <span className="font-bold">{i + 1}.</span>
                      <div>
                        <p className="font-medium text-sm mb-2">{q.text}</p>
                        <div className="flex items-center gap-2 text-sm mb-2">
                           <span className="text-zinc-500">Your Answer:</span>
                           <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                              {skipped ? "Skipped" : q.options[answers[q.id]]}
                           </span>
                           {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                        {!isCorrect && (
                           <div className="text-sm">
                             <span className="text-zinc-500">Correct Answer:</span> <span className="text-green-600 font-semibold">{q.options[q.correctIdx]}</span>
                           </div>
                        )}
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => window.location.reload()} className="mt-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
               Retake Exam
            </button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
         <div>
            <h1 className="text-xl font-bold">Post-UTME Mock</h1>
            <p className="text-sm text-zinc-500">{currentQ.subject} Session</p>
         </div>
         <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmit} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
              Submit
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col">
           <motion.div 
             key={currentQ.id}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-zinc-100 dark:border-zinc-800 flex-1"
           >
              <div className="flex justify-between items-center mb-8">
                 <span className="text-zinc-500 font-medium">Question {currentIdx + 1} of {mockQuestions.length}</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-semibold mb-10 leading-relaxed font-open-sans">
                {currentQ.text}
              </h2>

              <div className="space-y-4">
                {currentQ.options.map((opt, i) => {
                  const isSelected = answers[currentQ.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                        isSelected ? 'border-blue-500 text-blue-600 bg-white dark:bg-zinc-900' : 'border-zinc-300 text-zinc-500'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
           </motion.div>

           {/* Navigation Controls */}
           <div className="flex items-center justify-between mt-6">
              <button 
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 font-semibold text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>
              
              <button 
                onClick={() => setCurrentIdx(Math.min(mockQuestions.length - 1, currentIdx + 1))}
                disabled={currentIdx === mockQuestions.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Right Sidebar: Navigator & Progress */}
        <div className="w-full lg:w-80">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 sticky top-24">
              <h3 className="font-bold mb-4">Progress overview</h3>
              <div className="flex justify-between text-sm mb-2 text-zinc-500">
                <span>{answeredCount} Answered</span>
                <span>{mockQuestions.length - answeredCount} Remaining</span>
              </div>
              <Progress value={progress} className="h-2 mb-8 bg-zinc-100 dark:bg-zinc-800" />

              <h3 className="font-bold mb-4">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-3">
                 {mockQuestions.map((q, i) => {
                   const isAnswered = answers[q.id] !== undefined;
                   const isCurrent = currentIdx === i;
                   return (
                     <button
                       key={q.id}
                       onClick={() => setCurrentIdx(i)}
                       className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${
                         isCurrent 
                           ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 bg-blue-100 text-blue-700 dark:bg-blue-900/50' 
                           : isAnswered 
                             ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                             : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200'
                       }`}
                     >
                       {i + 1}
                     </button>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
