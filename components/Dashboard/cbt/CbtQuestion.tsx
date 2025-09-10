"use client";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { renderOptionText } from "./FormatOption";

export default function CbtQuestion({ question, answer, onAnswer }: any) {
  return (
    <Card className="p-6">
      <CardContent className="space-y-4">
        <h3 className="text-sm font-normal font-poppins">
          {question.questionText}
        </h3>
        <RadioGroup value={answer || ""} onValueChange={(val) => onAnswer(val)}>
          {question.options.map((opt: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center space-x-3 font-light text-xs font-poppins"
            >
              <RadioGroupItem value={opt.optionText} id={`opt-${idx}`} />
              <Label htmlFor={`opt-${idx}`}>
                {renderOptionText(opt.optionText)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
