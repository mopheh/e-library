"use client";

import { BookOpen, Users, HelpCircle, FileText, ArrowLeft, MessageSquare, Timer, BrainCircuit, MonitorPlay, Sparkles, Quote } from "lucide-react";
import { StudyRoomsList } from "@/components/Dashboard/StudyRoomsList";
import { ExamInsightsView } from "@/components/Dashboard/ExamInsightsView";
import { SurvivalGuidesList } from "@/components/Dashboard/SurvivalGuidesList";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";

export default function CourseWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["course-workspace", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/workspace`);
      if (!res.ok) throw new Error("Failed to load workspace");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-1/4 bg-muted animate-pulse rounded"></div>
        <div className="h-64 bg-muted animate-pulse rounded-xl"></div>
      </div>
    );
  }

  if (!workspace || workspace.error) {
    return (
      <div className="p-6 md:p-8 text-center mt-20">
        <h2 className="text-2xl font-semibold font-cabin">Course Not Found</h2>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block font-poppins text-xs font-light">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { course, materials, threads, questionsCount } = workspace;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 flex-1 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start justify-between">
        <div className="w-full">
          <Link href="/dashboard" className="flex items-center text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors font-poppins">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge variant="secondary" className="text-xs font-poppins px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {course.courseCode}
            </Badge>
            <Badge variant="outline" className="text-xs font-poppins px-3 py-1 border-gray-200 dark:border-zinc-700">
              {course.unitLoad} Units
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-cabin text-foreground">
            {course.title}
          </h1>
          <p className="text-muted-foreground mt-2 font-light text-sm font-poppins max-w-3xl">
            Welcome to the official workspace for {course.courseCode}. Access materials, collaborate with peers, and prepare for exams.
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="materials" className="w-full mt-8">
        <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="materials" className="flex flex-col sm:flex-row items-center gap-2 font-poppins py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg">
            <BookOpen className="w-4 h-4" /> <span className="text-xs">Materials</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex flex-col sm:flex-row items-center gap-2 font-poppins py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg">
            <Users className="w-4 h-4" /> <span className="text-xs">Community</span>
          </TabsTrigger>
          <TabsTrigger value="study-rooms" className="flex flex-col sm:flex-row items-center gap-2 font-poppins py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg">
            <MonitorPlay className="w-4 h-4" /> <span className="text-xs">Study Rooms</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex flex-col sm:flex-row items-center gap-2 font-poppins py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg">
            <HelpCircle className="w-4 h-4" /> <span className="text-xs">Quizzes</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex flex-col sm:flex-row items-center gap-2 font-poppins py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg text-amber-600 dark:text-amber-500">
            <Sparkles className="w-4 h-4" /> <span className="text-xs">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex flex-col sm:flex-row items-center gap-2 font-poppins py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg text-emerald-600 dark:text-emerald-500">
            <Quote className="w-4 h-4" /> <span className="text-xs">Guides</span>
          </TabsTrigger>
          <TabsTrigger value="tutor" className="flex flex-col sm:flex-row items-center gap-2 font-poppins text-purple-600 dark:text-purple-400 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-lg">
            <MessageSquare className="w-4 h-4" /> <span className="text-xs">AI Tutor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <h3 className="text-xl font-medium font-cabin">Course Materials</h3>
          </div>
          
          {materials.length === 0 ? (
            <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 shadow-sm">
              <div className="bg-gray-50 dark:bg-zinc-900 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted-foreground opacity-60" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2 font-cabin">No Materials Yet</h3>
              <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto font-poppins">
                There are no lecture notes or textbooks uploaded for this course yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {materials.map((doc: any) => (
                <Card key={doc.id} className="flex flex-col h-full hover:shadow-lg transition-all duration-300 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 w-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="pb-3 flex-grow pt-5">
                     <Badge className="font-poppins text-xs w-fit mb-3 bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200 font-light">{doc.type}</Badge>
                     <CardTitle className="text-lg line-clamp-2 leading-snug font-cabin group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.title}</CardTitle>
                     <CardDescription className="line-clamp-2 text-xs mt-2 font-poppins text-gray-500">{doc.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 pb-5 border-t border-gray-100 dark:border-zinc-800 px-6 mt-auto flex flex-col items-start gap-4 bg-gray-50/50 dark:bg-zinc-900/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 w-full">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {doc.postedBy?.fullName?.[0] || "?"}
                      </div>
                      <span className="truncate flex-1">{doc.postedBy?.fullName || "Unknown"}</span>
                      <span className="whitespace-nowrap">• {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                    </div>
                    <Link href={`/dashboard/pdf/${doc.id}`} passHref className="w-full">
                       <div className="w-full text-center bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-700 dark:hover:bg-zinc-800 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
                         Open Viewer
                       </div>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-semibold font-poppins">Course Discussions</h3>
            <Link href={`/dashboard/threads/new?courseId=${course.id}`} className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
               New Topic
            </Link>
          </div>
          
          {threads.length === 0 ? (
             <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 shadow-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6">
                   <Users className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2 font-poppins">No Discussions Yet</h3>
                <p className="text-base text-muted-foreground max-w-sm mx-auto font-open-sans">
                  Be the first to start a discussion or ask a question in this course workspace.
                </p>
             </div>
          ) : (
             <div className="space-y-4">
               {threads.map((thread: any) => (
                  <Link key={thread.id} href={`/dashboard/threads/${thread.id}`} className="block group">
                    <Card className="hover:border-blue-400/50 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800">
                       <CardHeader className="pb-4 pt-5 px-6">
                         <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">{thread.title}</CardTitle>
                         <CardDescription className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                             {thread.author?.fullName?.[0] || "?"}
                           </div>
                           <span>Posted by {thread.author?.fullName || "Unknown"}</span>
                           <span className="text-gray-300 dark:text-zinc-700">•</span>
                           <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                         </CardDescription>
                       </CardHeader>
                    </Card>
                  </Link>
               ))}
             </div>
          )}
        </TabsContent>

        <TabsContent value="study-rooms" className="mt-8">
          <StudyRoomsList courseId={course.id} />
        </TabsContent>

        <TabsContent value="quizzes" className="mt-8">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-semibold font-poppins">Smart Exam Preparation</h3>
           </div>
           
           {questionsCount > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-all border-green-200 dark:border-green-900 overflow-hidden relative">
                  <div className="absolute right-0 top-0 p-6 opacity-5">
                    <BrainCircuit className="w-32 h-32 text-green-600" />
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                      <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-xl font-poppins">Standard Mock Exam</CardTitle>
                    <CardDescription className="font-open-sans">
                      A timed exam mixed from {questionsCount} available past questions for this course.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href={`/dashboard/cbt/session/new?courseId=${course.id}`} className="w-full">
                      <div className="w-full text-center bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
                        Start 50-Question Mock
                      </div>
                    </Link>
                  </CardFooter>
                </Card>
             </div>
           ) : (
             <div className="text-center p-20 bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-950/10 dark:to-zinc-950 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <div className="bg-orange-100 dark:bg-orange-900/40 w-24 h-24 flex items-center justify-center rounded-2xl mx-auto mb-6 transform rotate-3">
                   <HelpCircle className="w-12 h-12 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-orange-950 dark:text-orange-100 mb-3 font-poppins">No Questions Available</h3>
                <p className="text-lg text-orange-800/70 dark:text-orange-200/60 max-w-md mx-auto font-open-sans mb-6">
                  There are no extracted past questions for {course.courseCode} yet. Once materials are parsed by AI, mock exams will appear here.
                </p>
                <Link href={`/student/dashboard`}>
                  <div className="inline-flex items-center justify-center bg-white border border-gray-200 text-gray-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-200 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                    Upload Past Questions
                  </div>
                </Link>
             </div>
           )}
        </TabsContent>

        <TabsContent value="insights" className="mt-8">
           <ExamInsightsView courseId={course.id} />
        </TabsContent>

        <TabsContent value="guides" className="mt-8">
           <SurvivalGuidesList courseId={course.id} />
        </TabsContent>

        <TabsContent value="tutor" className="mt-8">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-semibold font-poppins text-purple-900 dark:text-purple-100">AI Course Tutor</h3>
           </div>
           <div className="text-center p-20 bg-gradient-to-b from-purple-50/80 to-indigo-50/30 dark:from-purple-900/10 dark:to-indigo-950/10 rounded-2xl border border-purple-200/60 dark:border-purple-800/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <MessageSquare className="w-64 h-64 text-purple-900" />
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/40 w-24 h-24 flex items-center justify-center rounded-full mx-auto mb-8 shadow-inner relative z-10">
                 <MessageSquare className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-4 font-poppins relative z-10">Your Personal AI Tutor</h3>
              <p className="text-lg text-purple-700/80 dark:text-purple-200/70 max-w-xl mx-auto font-open-sans leading-relaxed relative z-10">
                A highly intelligent AI tutor, trained specifically on all materials and textbooks in {course.courseCode}, is currently being prepared to help you study more effectively.
              </p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
