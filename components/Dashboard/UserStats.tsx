"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { FileText, BookOpen, CalendarDays } from "lucide-react";
import { Button } from "../ui/button";
import { useReadingSession } from "@/hooks/useUsers";
import { useMyBooks } from "@/hooks/useBooks";
import Welcome from "../Welcome";
import { WelcomeToast } from "../welcome-toast";

// Dummy data (replace with real data)
const readingProgress = [
  { day: "Mon", pages: 20 },
  { day: "Tue", pages: 35 },
  { day: "Wed", pages: 15 },
  { day: "Thu", pages: 50 },
  { day: "Fri", pages: 30 },
  { day: "Sat", pages: 25 },
  { day: "Sun", pages: 40 },
];

export default function UserStats() {
  const { user } = useUser();
  const [pagesRead, setPagesRead] = useState(0);
  const { data: myBooks } = useMyBooks();

  const { data } = useReadingSession();
  useEffect(() => {
    if (data) {
      const books = data.reduce(
        (sum: number, book: { pagesRead: number }) => sum + book.pagesRead,
        0
      );
      setPagesRead(books);
    }
  }, [data]);
  const [goal, setGoal] = useState(20); // pages/day
  const today = new Date();
  const resumptionDate = new Date(2025, 2, 3); // March 3, 2025
  const examDate = new Date(2025, 9, 14);
  const daysToExam = Math.max(
    0,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalBooks = 7;
  const totalPages = 215;

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 font-poppins md:flex-1">
      <WelcomeToast name={user?.firstName} />
      {/* <div>
        <Welcome
          name={user?.firstName}
          guide="Monitor all books and material in your library"
        />
      </div> */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-light font-poppins">
            <FileText className="h-5 w-5 text-blue-500" />
            Pages Read
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">{pagesRead}</p>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={readingProgress || data}>
              <Line
                type="monotone"
                dataKey="pages"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
        <CardFooter>
          <p className="text-xs font-poppins text-muted-foreground">
            +12% from last week
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-light font-poppins">
            <BookOpen className="h-5 w-5 text-green-500" />
            Books Read
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalBooks}</p>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={readingProgress}>
              <Bar dataKey="pages" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
        <CardFooter>
          <p className="text-xs font-poppins text-muted-foreground">
            +2 since last month
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-light font-poppins">
            Study Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-2 font-poppins">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGoal((g) => Math.max(0, g - 1))}
              className="px-2  rounded-md border hover:bg-muted"
            >
              –
            </button>
            <p className="text-3xl font-bold text-indigo-500">{goal}</p>
            <button
              onClick={() => setGoal((g) => g + 1)}
              className="px-2  rounded-md border hover:bg-muted"
            >
              +
            </button>
          </div>
          <p className="text-xs uppercase font-normal text-muted-foreground">
            Pages / Day
          </p>

          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={readingProgress}>
              <Bar dataKey="pages" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <XAxis dataKey="day" hide />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
        {/* <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-blue-500 w-full"
          >
            Set Goal
          </Button>
        </CardFooter> */}
      </Card>
      <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-xs font-light font-poppins">
      <CalendarDays className="h-5 w-5 text-red-500" />
      Days to Exam
    </CardTitle>
  </CardHeader>

  <CardContent className="flex flex-col items-center justify-center font-poppins">
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-20 h-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="35"
          stroke="#e5e7eb"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          stroke="#ef4444"
          strokeWidth="6"
          strokeDasharray={`${440 - daysToExam * 2}, 440`}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="absolute text-xl font-bold text-red-500">
        {daysToExam}
      </span>
    </div>
    <p className="text-xs mt-2 text-muted-foreground">Days Left</p>
  </CardContent>

  <CardFooter className="flex justify-center text-xs text-muted-foreground">
    Exam: {examDate.toDateString().split(" ").slice(1).join(" ")}
  </CardFooter>
</Card>

      {/* <Card className="px-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-light font-poppins">
            <CalendarDays className="h-5 w-5 text-red-500" />
            Days to Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <Calendar
            mode="single"
            selected={examDate}
            disabled={(date) => date < resumptionDate}
            className="rounded-md border shadow-sm text-xs font-poppins font-normal w-full"
            modifiers={{
              semester: { from: resumptionDate, to: examDate },
              exam: examDate,
              today: new Date(),
            }}
            modifiersClassNames={{
              semester: "bg-red-100 dark:bg-zinc-800 text-red-700", // highlight the whole range
              exam: "!bg-red-600 text-white rounded-r-lg", // exam day stands out
              today: "border border-red-500 text-red-500 font-medium", // mark today
            }}
          />
          <div className="mt-3 flex justify-center">
            <p className="text-xs font-normal font-poppins text-red-500">
              {daysToExam} days left
            </p>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
