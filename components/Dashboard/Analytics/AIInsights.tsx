import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useAIInsights } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

const AIInsights = () => {
  const { data, isLoading } = useAIInsights();

  return (
    <Card className="h-full border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <CardTitle className="text-base text-indigo-950 dark:text-indigo-100 font-open-sans font-semibold">AI Assistant</CardTitle>
                <CardDescription className="text-xs font-poppins">Personalized reading tips</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        ) : (
          <div className="space-y-3">
            {data?.insights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                 <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
                 <p className="text-xs font-poppins text-muted-foreground leading-relaxed">
                    {insight}
                 </p>
              </div>
            ))}
            {(!data?.insights || data.insights.length === 0) && (
                <p className="text-xs font-poppins text-muted-foreground italic">
                    Start reading to get personalized insights!
                </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;
