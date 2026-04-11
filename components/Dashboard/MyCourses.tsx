"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Users, HelpCircle, FileText } from 'lucide-react';
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
  unitLoad: number;
  level: string;
}

interface MyCoursesProps {
  courses: Course[];
  loading?: boolean;
}

const MyCoursesCard = ({ course }: { course: Course }) => {
  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col h-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800">
      <CardHeader className="pb-2 flex-grow">
        <div className="flex justify-between items-start font-poppins !font-light !text-xs">
          <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{course.courseCode}</Badge>
          <Badge variant="outline" className="border-gray-200 dark:border-zinc-700">{course.unitLoad} Units</Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2 font-cabin">{course.title}</CardTitle>
        <CardDescription className="font-poppins text-xs">{course.level} Level</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2 font-poppins">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Materials
          </div>
          <div className="flex items-center gap-1">
             <HelpCircle className="w-3.5 h-3.5 text-orange-500" /> Quizzes
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-purple-500" /> Tutor
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <Link href={`/dashboard/courses/${course.id}`} className="w-full">
          <div className="w-full text-center bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 py-2.5 rounded-lg text-xs font-medium font-poppins transition-all shadow-sm">
            Enter Workspace
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
      <div className="text-center p-8 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800">
        <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-normal font-cabin text-foreground">No Courses Found</h3>
        <p className="text-xs font-poppins text-muted-foreground mt-1">
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
