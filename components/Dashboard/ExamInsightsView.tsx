"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Loader2, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const ExamInsightsView = ({ courseId }: { courseId: string }) => {
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["examInsights", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/insights`);
      if (!res.ok) throw new Error("Failed to load insights");
      return res.json();
    },
  });

  const generateInsights = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/insights`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate insights");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.message === "No questions to analyze") {
         toast.error("No questions available to analyze for this course.");
      } else {
         toast.success("AI successfully generated exam insights!");
      }
      queryClient.invalidateQueries({ queryKey: ["examInsights", courseId] });
    },
    onError: () => toast.error("Failed to generate insights."),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold font-poppins flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Exam Intelligence
          </h3>
          <p className="text-sm text-muted-foreground font-open-sans">
            Our AI analyzes past questions to predict the most frequent topics you will be tested on.
          </p>
        </div>
        <Button 
          onClick={() => generateInsights.mutate()} 
          disabled={generateInsights.isPending}
          className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-semibold shadow-sm shrink-0"
        >
          {generateInsights.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><BrainCircuit className="w-4 h-4 mr-2" /> Recalculate Insights</>
          )}
        </Button>
      </div>

      {!insights || insights.length === 0 ? (
        <div className="text-center p-16 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-950 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
          <div className="bg-white dark:bg-zinc-900 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <TrendingUp className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2 font-poppins">No Insights Available</h3>
          <p className="text-base text-muted-foreground max-w-sm mx-auto font-open-sans mb-6">
            Click recalculate to let our AI scan the course material and build a topical heatmap.
          </p>
          <Button 
            onClick={() => generateInsights.mutate()} 
            disabled={generateInsights.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
             {generateInsights.isPending ? "Scanning..." : "Generate Insights Now"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight: any, index: number) => {
             const isHighYield = index < 3 && insight.frequencyPercentage > 15;
             return (
              <Card key={insight.id} className={`flex flex-col h-full hover:shadow-lg transition-all border-gray-200 dark:border-zinc-800 overflow-hidden relative ${isHighYield ? 'ring-1 ring-amber-400/50' : ''}`}>
                {isHighYield && (
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    HIGH YIELD
                  </div>
                )}
                <CardHeader className="pb-3 pt-6">
                  <CardTitle className="text-lg line-clamp-2 leading-tight font-poppins text-gray-800 dark:text-gray-100 pr-12">
                     {insight.topicName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6 mt-auto">
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                       {isHighYield ? <AlertTriangle className="w-4 h-4 text-amber-500"/> : null}
                       Frequency Target
                     </span>
                     <span className="text-2xl font-bold font-poppins text-indigo-600 dark:text-indigo-400">{insight.frequencyPercentage}%</span>
                   </div>
                   <Progress value={insight.frequencyPercentage} className="h-2.5" />
                </CardContent>
              </Card>
             );
          })}
        </div>
      )}
    </div>
  );
};
