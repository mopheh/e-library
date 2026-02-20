import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function CbtResult({
  score,
  total,
  onRetry,
}: {
  score: number;
  total: number;
  onRetry: () => void;
}) {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 50;

  return (
    <Card className="max-w-md mx-auto p-6 text-center shadow-lg border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-cairo text-zinc-900 dark:text-zinc-100">Assessment Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Your Score</p>
            <div className="flex items-end justify-center gap-2">
                <span className="text-6xl font-bold text-zinc-900 dark:text-zinc-50">{score}</span>
                <span className="text-xl text-zinc-400 mb-2">/ {total}</span>
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
                <span>0%</span>
                <span>{percentage}%</span>
                <span>100%</span>
            </div>
            <Progress value={percentage} className={`h-3 ${passed ? "bg-green-100" : "bg-red-100"}`}  />
             <p className={`text-sm font-medium ${passed ? "text-green-600" : "text-red-500"}`}>
                {passed ? "Excellent work! Keep it up." : "Good effort. Try again to improve."}
             </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
            <Button onClick={onRetry} className="w-full gap-2" size="lg">
                <RefreshCcw className="w-4 h-4" /> Try Again
            </Button>
            <Button asChild variant="outline" className="w-full gap-2" size="lg">
                <Link href="/student/dashboard">
                    <Home className="w-4 h-4" /> Return Home
                </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
