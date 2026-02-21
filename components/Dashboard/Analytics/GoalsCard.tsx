import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, CheckCircle2 } from "lucide-react";
import { useGoals, useMutationGoal } from "@/hooks/useAnalytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const GoalsCard = () => {
  const { data: goals, isLoading } = useGoals();
  const { mutate: saveGoal } = useMutationGoal();
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [type, setType] = useState("books_read");

  const handleSave = () => {
    saveGoal({ type, target: parseInt(target), frequency: "weekly" }); 
    setIsOpen(false);
    setTarget("");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="text-base font-open-sans font-semibold">Weekly Goals</CardTitle>
                <CardDescription className="font-poppins text-xs">Track your reading targets</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-open-sans font-semibold">Set Weekly Goal</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 font-poppins">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Goal Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="books_read">Books Completed</SelectItem>
                                    <SelectItem value="minutes_read">Minutes Read</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="target">Target Amount</Label>
                            <Input
                                id="target"
                                type="number"
                                placeholder={type === "books_read" ? "e.g. 1" : "e.g. 120"}
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Save Goal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
               {Array.from({ length: 3 }).map((_, i) => (
                   <div key={i} className="space-y-2">
                       <div className="flex justify-between">
                           <Skeleton className="h-4 w-16" />
                           <Skeleton className="h-4 w-8" />
                       </div>
                       <Skeleton className="h-2 w-full" />
                   </div>
               ))}
            </div>
          ) : goals && goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="font-medium text-muted-foreground font-poppins">
                        {goal.type === "books_read" ? "Books" : "Minutes"}
                    </span>
                    <span className="font-bold font-cabin text-xs">
                        {goal.currentProgress || 0} / {goal.target}
                    </span>
                </div>
                <Progress value={Math.min(100, Math.round(((goal.currentProgress || 0) / goal.target) * 100))} className="h-2" />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <Target className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground font-poppins">No active goals.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalsCard;
