"use client";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { renderOptionText } from "./FormatOption";

export default function CbtQuestion({ question, answer, onAnswer }: any) {
  return (
    <Card className="p-6 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardContent className="space-y-6">
        <h3 className="text-base sm:text-lg font-medium font-poppins text-zinc-900 dark:text-zinc-100 leading-relaxed">
          {question.questionText}
        </h3>
        <RadioGroup value={answer || ""} onValueChange={(val) => onAnswer(val)} className="space-y-3">
          {question.options.map((opt: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                answer === opt.optionText
                  ? "border-green-500 bg-green-50 dark:bg-green-900/10 dark:border-green-500/50"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <RadioGroupItem value={opt.optionText} id={`opt-${idx}`} className="text-green-600 border-zinc-400" />
              <Label 
                htmlFor={`opt-${idx}`} 
                className="flex-1 cursor-pointer font-normal text-sm sm:text-base font-poppins text-zinc-700 dark:text-zinc-300"
              >
                {renderOptionText(opt.optionText)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
