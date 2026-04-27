"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2, Settings, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { saveCbtSubjects } from "@/actions/aspirant";
import { toast } from "sonner";

const STORAGE_KEY = "univault_aspirant_cbt_session";

const AVAILABLE_SUBJECTS = [
  "mathematics", "commerce", "accounting", "biology", "physics", 
  "chemistry", "englishlit", "government", "crk", "geography", 
  "economics", "history", "irk", "civiledu", "insurance", "currentaffairs"
];

// function capitalize(s: string) {
//   return s.charAt(0).toUpperCase() + s.slice(1);
// }

export default function AspirantCbt() {
  const [mode, setMode] = useState<"loading" | "onboarding" | "config" | "exam">("loading");
  const [profileCombos, setProfileCombos] = useState<string[]>([]);
  
  // Onboarding State
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [isSavingOnboard, setIsSavingOnboard] = useState(false);

  // Config State
  const [configSubjects, setConfigSubjects] = useState<string[]>([]);
  const [configTime, setConfigTime] = useState(1800); // 30m default
  const [configLimit, setConfigLimit] = useState(10);

  // Exam State
  const [questions, setQuestions] = useState<{ id: string; subject: string; questionText?: string; text?: string; options: { optionText: string; isCorrect: boolean }[]; explanation?: string }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Initial Load & Session Recovery
  useEffect(() => {
    const initializeCbt = async () => {
      try {
        // Try Offline Cache First
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { questions: q, answers: a, timeLeft: t, currentIdx: i, timestamp } = JSON.parse(saved);
          if (q && q.length > 0) {
            const elapsedSinceClosed = timestamp ? Math.floor((Date.now() - timestamp) / 1000) : 0;
            const trueTimeLeft = Math.max(0, t - elapsedSinceClosed);

            setQuestions(q);
            setAnswers(a || {});
            setTimeLeft(trueTimeLeft);
            setCurrentIdx(i || 0);
            
            if (trueTimeLeft <= 0) {
              setIsSubmitted(true);
            }
            setMode("exam");
            return;
          }
        }

        // Fetch User Profile
        const res = await fetch("/api/aspirant/profile");
        const data = await res.json();
        
        if (data.success && data.profile?.subjectCombinations?.length > 0) {
          const combos = data.profile.subjectCombinations;
          setProfileCombos(combos);
          setConfigSubjects(combos); // select all by default
          setMode("config");
        } else {
          setMode("onboarding");
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initializeCbt();
  }, []);

  // Securely backup session slice progressively
  useEffect(() => {
    if (mode === "exam" && questions.length > 0 && !isSubmitted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        questions,
        answers,
        timeLeft,
        currentIdx,
        timestamp: Date.now()
      }));
    }
  }, [questions, answers, currentIdx, timeLeft, isSubmitted, mode]);

  // Timer
  useEffect(() => {
    if (mode !== "exam" || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft, mode]);

  // Handlers
  const toggleElective = (sub: string) => {
    if (selectedElectives.includes(sub)) {
      setSelectedElectives(prev => prev.filter(s => s !== sub));
    } else {
      if (selectedElectives.length < 3) {
        setSelectedElectives(prev => [...prev, sub]);
      } else {
        toast.error("You can only select exactly 3 electives (English is automatic).");
      }
    }
  };

  const handleSaveOnboarding = async () => {
    if (selectedElectives.length !== 3) {
      toast.error("Please pick exactly 3 electives.");
      return;
    }
    setIsSavingOnboard(true);
    const finalCombos = ["english", ...selectedElectives];
    const res = await saveCbtSubjects(finalCombos);
    setIsSavingOnboard(false);

    if (res.success) {
      setProfileCombos(finalCombos);
      setConfigSubjects(finalCombos);
      toast.success("JAMB Subjects Locked Successfully!");
      setMode("config");
    } else {
      toast.error(res.error);
    }
  };

  const toggleConfigSubject = (sub: string) => {
    if (configSubjects.includes(sub)) {
      setConfigSubjects(prev => prev.filter(s => s !== sub));
    } else {
      setConfigSubjects(prev => [...prev, sub]);
    }
  };

  const startExam = async () => {
    if (configSubjects.length === 0) {
      toast.error("Please select at least 1 subject to practice.");
      return;
    }
    setMode("loading");
    try {
      const qs = configSubjects.join(",");
      const res = await fetch(`/api/aspirant/cbt?subjects=${encodeURIComponent(qs)}&limit=${configLimit}`);
      const data = await res.json();
      
      if (data.success && data.questions.length > 0) {
        setQuestions(data.questions);
        setTimeLeft(configTime);
        setCurrentIdx(0);
        setAnswers({});
        setIsSubmitted(false);
        setMode("exam");
      } else {
        toast.error("No questions found for the selected configuration.");
        setMode("config");
      }
    } catch (err) {
        console.error("CBT fetch error:", err);
        toast.error("Failed to start exam network error.");
        setMode("config");
    }
  };

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  
  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setAnswers({ ...answers, [currentQ.id]: optIdx });
  };

  const handleSubmit = async () => {
    setIsSyncing(true);
    let score = 0;
    questions.forEach(q => {
        if (answers[q.id] !== undefined && q.options[answers[q.id]].isCorrect) {
            score++;
        }
    });

    try {
        await fetch("/api/aspirant/cbt", {
            method: "POST",
            body: JSON.stringify({ score, totalQuestions: questions.length })
        });
        setIsSubmitted(true);
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error("Submission failed:", err);
    } finally {
        setIsSyncing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ----------------------------------------------------
  // RENDERERS
  // ----------------------------------------------------

  if (mode === "loading") {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 border-blue-500 animate-spin text-blue-500" />
      </div>
    );
  }

  if (mode === "onboarding") {
    return (
      <div className="flex-1 p-4 md:p-8 pt-12 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col items-center">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="mb-6">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Profile Setup</span>
              <h1 className="text-3xl font-bold font-cabin mb-2">Set Your JAMB Subject Combinations</h1>
              <p className="text-zinc-500">Pick the 3 explicit electives you applied for in JAMB. This locks your CBT testing strictly to your path to guarantee true data integrity.</p>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center justify-between border border-zinc-200 dark:border-zinc-700 mb-8 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-bold text-lg">Use Of English</h3>
                  <p className="text-xs text-zinc-500">Compulsory for all candidates</p>
                </div>
              </div>
              <CheckCircle className="text-green-500" />
            </div>

            <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-lg">Select 3 Electives</h3>
               <span className="text-sm font-medium bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">{selectedElectives.length}/3 Picked</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {AVAILABLE_SUBJECTS.map((sub) => {
                const isSelected = selectedElectives.includes(sub);
                return (
                  <button
                    key={sub}
                    onClick={() => toggleElective(sub)}
                    className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300'}`}
                  >
                    <span className="capitalize font-medium text-sm">{sub === "englishlit" ? "Literature" : sub === "civiledu" ? "Civic Edu" : sub === "crk" ? "CRK" : sub}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </button>
                )
              })}
            </div>

            <button 
              onClick={handleSaveOnboarding} 
              disabled={isSavingOnboard || selectedElectives.length !== 3}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold py-4 rounded-xl disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {isSavingOnboard ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Proceed to CBT Hub"}
            </button>
         </motion.div>
      </div>
    );
  }

  if (mode === "config") {
    return (
      <div className="flex-1 p-4 md:p-8 pt-12 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col items-center">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="flex justify-center mb-6">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                 <Settings className="w-8 h-8" />
               </div>
            </div>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold font-cabin mb-2">Configure Mock Session</h1>
              <p className="text-zinc-500">Customize your CBT environment based on your registered Jamb combination.</p>
            </div>

            <div className="space-y-8">
              {/* Subjects Row */}
              <div>
                <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider mb-4">Select Focus Subjects (Max 4)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {profileCombos.map(sub => (
                    <button 
                      key={sub} 
                      onClick={() => toggleConfigSubject(sub)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${configSubjects.includes(sub) ? 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500'}`}
                    >
                       <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${configSubjects.includes(sub) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-300'}`}>
                         {configSubjects.includes(sub) && <CheckCircle className="w-3 h-3" />}
                       </div>
                       <span className="capitalize font-semibold">{sub === "englishlit" ? "Literature" : sub === "crk" ? "CRK" : sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Questions Per Subject */}
                 <div>
                   <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider mb-4">Questions / Subject</h3>
                   <div className="flex gap-2">
                     {[10, 20, 40].map(val => (
                        <button key={val} onClick={() => setConfigLimit(val)} className={`flex-1 py-3 font-semibold rounded-xl border transition-colors ${configLimit === val ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                          {val}
                        </button>
                     ))}
                   </div>
                 </div>

                 {/* Timer Configuration */}
                 <div>
                   <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider mb-4">CBT Timer</h3>
                   <div className="flex gap-2">
                     {[{label: "15m", val: 900}, {label: "30m", val: 1800}, {label: "1H", val: 3600}, {label: "2H", val: 7200}].map(timeOpt => (
                        <button key={timeOpt.val} onClick={() => setConfigTime(timeOpt.val)} className={`flex-1 py-3 font-semibold rounded-xl border transition-colors ${configTime === timeOpt.val ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                          {timeOpt.label}
                        </button>
                     ))}
                   </div>
                 </div>
              </div>
            </div>

            <button 
              onClick={startExam} 
              className="mt-10 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2"
            >
               <Play className="w-5 h-5 fill-current" /> Initialize Assessment Engine
            </button>
         </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // EXAM RENDERER
  // ----------------------------------------------------

  if (isSubmitted) {
    const score = questions.reduce((acc, q) => acc + (answers[q.id] !== undefined && q.options[answers[q.id]].isCorrect ? 1 : 0), 0);
    
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
              You scored {score} out of {questions.length}. Review your answers below.
            </p>

            <div className="text-left space-y-6 max-h-96 overflow-y-auto pr-2">
              {questions.map((q, i) => {
                const correctIdx = q.options.findIndex((o: { isCorrect: boolean }) => o.isCorrect);
                const isCorrect = answers[q.id] === correctIdx;
                const skipped = answers[q.id] === undefined;
                return (
                  <div key={q.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                    <div className="flex gap-2">
                      <span className="font-bold">{i + 1}.</span>
                      <div>
                        <p className="font-medium text-sm mb-2" dangerouslySetInnerHTML={{ __html: q.questionText || q.text || "" }}></p>
                        <div className="flex items-center gap-2 text-sm mb-2">
                           <span className="text-zinc-500">Your Answer:</span>
                           <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                              {skipped ? "Skipped" : q.options[answers[q.id]]?.optionText}
                           </span>
                           {isCorrect ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                        {!isCorrect && (
                           <div className="text-sm">
                             <span className="text-zinc-500">Correct Answer:</span> <span className="text-green-600 font-semibold">{q.options[correctIdx]?.optionText}</span>
                           </div>
                        )}
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg" dangerouslySetInnerHTML={{ __html: q.explanation || 'No explanation available.' }}></p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => window.location.reload()} className="mt-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
               Exit to Dashboard
            </button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 gap-4">
         <div>
            <h1 className="text-xl font-bold">Post-UTME Assesment Engine</h1>
            <p className="text-sm text-zinc-500 capitalize px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 inline-block rounded font-medium mt-2">{currentQ?.subject || 'Assessment'}</p>
         </div>
         <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={isSyncing}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Assessment"}
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col">
           <motion.div 
             key={currentQ?.id}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-zinc-100 dark:border-zinc-800 flex-1"
           >
              <div className="flex justify-between items-center mb-8">
                 <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-xs font-bold text-zinc-500">Question {currentIdx + 1} of {questions.length}</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-semibold mb-10 leading-relaxed font-open-sans" dangerouslySetInnerHTML={{ __html: currentQ?.questionText || '' }}>
              </h2>

              <div className="space-y-4">
                {currentQ?.options?.map((opt: { optionText: string }, i: number) => {
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
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold shrink-0 ${
                        isSelected ? 'border-blue-500 text-blue-600 bg-white dark:bg-zinc-900' : 'border-zinc-300 text-zinc-500'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="font-medium" dangerouslySetInnerHTML={{ __html: opt.optionText }}></span>
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
                onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >                  
                Next <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Right Sidebar: Navigator & Progress */}
        <div className="w-full lg:w-80">
           <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 sticky top-24">
              <h3 className="font-bold mb-4">Progress Tracker</h3>
              <div className="flex justify-between text-sm mb-2 text-zinc-500 font-medium">
                <span>{answeredCount} Completed</span>
                <span>{questions.length - answeredCount} Pending</span>
              </div>
              <Progress value={progressPercent} className="h-2 mb-8 bg-zinc-100 dark:bg-zinc-800" />

              <h3 className="font-bold mb-4">Question Map</h3>
              <div className="grid grid-cols-5 gap-3">
                 {questions.map((q, i) => {
                   const isAnswered = answers[q.id] !== undefined;
                   const isCurrent = currentIdx === i;
                   return (
                     <button
                       key={q.id}
                       onClick={() => setCurrentIdx(i)}
                       className={`w-full aspect-square rounded-xl font-bold flex items-center justify-center transition-all ${
                         isCurrent 
                           ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 bg-blue-100 text-blue-700 dark:bg-blue-900/50' 
                           : isAnswered 
                             ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                             : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 cursor-pointer'
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

