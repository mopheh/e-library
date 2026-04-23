"use client";

import React from 'react';
import Link from 'next/link';
import { BookOpen, Users, HelpCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  courseCode: string;
  title: string;
  level: string;
  unitLoad: number;
}

interface MyCoursesProps {
  courses: Course[];
  loading: boolean;
}

const MyCoursesCard = ({ course }: { course: Course }) => {
  // Mock progress for now - in production this would come from the database
  const mockProgress = Math.floor(Math.random() * 60) + 10;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 group overflow-hidden relative font-poppins">
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
          TOP COURSE
        </div>
      </div>

      <CardHeader className="pb-2 grow relative">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-none px-2 py-0.5">{course.courseCode}</Badge>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Active</span>
          </div>
        </div>
        <CardTitle className="text-xl font-cabin line-clamp-2 font-bold leading-tight group-hover:text-blue-600 transition-colors uppercase">{course.title}</CardTitle>
        <CardDescription className="text-xs font-poppins font-normal mt-1 uppercase opacity-70">{course.level} Level • {course.unitLoad} Units</CardDescription>
      </CardHeader>

      <CardContent className="pb-3 pt-2">
        <div className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-end text-[10px] text-zinc-500 font-normal uppercase tracking-wide">
              <span>Course Coverage</span>
              <span className="text-blue-600">{mockProgress}%</span>
            </div>
            <Progress value={mockProgress} className="h-1.5 bg-zinc-100 dark:bg-zinc-900 border-none" />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-1 font-poppins">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20">
              <BookOpen className="w-3.5 h-3.5 text-blue-600 mb-1" />
              <span className="text-[9px] font-normal text-blue-800 dark:text-blue-400">12</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20">
              <HelpCircle className="w-3.5 h-3.5 text-orange-600 mb-1" />
              <span className="text-[9px] font-normal text-orange-800 dark:text-orange-400">5 New</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-900/20">
              <Users className="w-3.5 h-3.5 text-purple-600 mb-1" />
              <span className="text-[9px] font-normal text-purple-800 dark:text-purple-400">Active</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-5 px-6">
        <Link href={`/dashboard/workspaces/${course.id}`} className="w-full">
          <div className="w-full text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 py-3 rounded-xl text-xs font-medium transition-all duration-300 shadow-sm group-hover:shadow-blue-500/10 uppercase">
            Open Workspace
          </div>
        </Link>
      </CardFooter>
    </Card>
  );
};

export const MyCourses = ({ courses, loading }: MyCoursesProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800 font-poppins">
        <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-bold text-foreground">No Courses Found</h3>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          You haven't registered for any courses yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course) => (
        <MyCoursesCard key={course.id} course={course} />
      ))}
    </div>
  );
};
