import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

export default function CbtResult({
  score,
  total,
  questions,
  answers,
  onRetry,
}: {
  score: number;
  total: number;
  questions: any[];
  answers: { [key: string]: string };
  onRetry: () => void;
}) {

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-[80vh] font-poppins flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-xl">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95 }} 
         animate={{ opacity: 1, scale: 1 }} 
         className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center"
       >
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">
            {score}
          </div>
          <h2 className="text-2xl font-bold mb-2">Assessment Completed</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            You scored {score} out of {total}. Review your answers below.
          </p>

          <div className="text-left space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {questions.map((q, i) => {
              const correctOpt = q.options.find((o: any) => o.isCorrect);
              const isCorrect = answers[q.id] === correctOpt?.optionText;
              const skipped = answers[q.id] === undefined;
              
              const renderOptionText = (text: string) => {
                if (text && text.includes("<") && text.includes(">")) {
                  return <span dangerouslySetInnerHTML={{ __html: text }} />;
                }
                return text;
              };

              return (
                <div key={q.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
                  <div className="flex gap-3">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-3 text-zinc-900 dark:text-zinc-100 leading-relaxed font-open-sans">
                         {q.questionText}
                      </p>
                      <div className="flex items-start gap-2 text-sm mb-3">
                         <span className="text-zinc-500 shrink-0 mt-0.5">Your Answer:</span>
                         <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {skipped ? "Skipped" : renderOptionText(answers[q.id])}
                         </span>
                         {isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      </div>
                      {!isCorrect && (
                         <div className="text-sm flex items-start gap-2">
                           <span className="text-zinc-500 shrink-0">Correct Answer:</span> 
                           <span className="text-green-600 font-semibold">{renderOptionText(correctOpt?.optionText)}</span>
                         </div>
                      )}
                      
                      {/* Only render explanation if it exists */}
                      {q.explanation && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg leading-relaxed">
                            {q.explanation}
                          </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={onRetry} className="mt-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
             Retake Assessment
          </button>
       </motion.div>
    </div>
  );
}
