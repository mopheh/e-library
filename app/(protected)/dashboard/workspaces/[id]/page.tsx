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
          <div className="flex flex-wrap items-center gap-4 mt-2 mb-2">
            <p className="text-muted-foreground font-light text-sm font-poppins max-w-3xl">
              Welcome to the official workspace for {course.courseCode}. Access materials, collaborate with peers, and prepare for exams.
            </p>
            <div className="flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/10 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30">
               <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">R</div>
               <span className="text-xs font-poppins text-blue-700 dark:text-blue-400">Managed by Faculty Rep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="materials" className="w-full mt-8">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1.5 rounded-2xl h-auto gap-1.5 mb-8 max-w-2xl">
          <TabsTrigger value="materials" className="flex items-center gap-2 font-poppins py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-none data-[state=active]:shadow-sm transition-all">
            <BookOpen className="w-4 h-4" /> <span className="text-sm">Materials</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2 font-poppins py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-none data-[state=active]:shadow-sm transition-all">
            <Sparkles className="w-4 h-4 text-amber-500" /> <span className="text-sm">Practice</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2 font-poppins py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-none data-[state=active]:shadow-sm transition-all">
            <Users className="w-4 h-4 text-blue-500" /> <span className="text-sm">Community</span>
          </TabsTrigger>
          <TabsTrigger value="tutor" className="flex items-center gap-2 font-poppins py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 rounded-xl shadow-none data-[state=active]:shadow-sm transition-all">
            <MessageSquare className="w-4 h-4 text-purple-500" /> <span className="text-sm">AI Tutor</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-0 space-y-6">
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
                  <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 w-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="pb-3 flex-grow pt-5">
                     <Badge className="font-poppins text-[10px] w-fit mb-3 bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200 font-light">{doc.type}</Badge>
                     <CardTitle className="text-lg line-clamp-2 leading-snug font-cabin group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.title}</CardTitle>
                     <CardDescription className="line-clamp-2 text-xs mt-2 font-poppins text-gray-500">{doc.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 pb-5 border-t border-gray-100 dark:border-zinc-800 px-6 mt-auto flex flex-col items-start gap-4">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-4 w-full">
                      <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                        {doc.postedBy?.fullName?.[0] || "?"}
                      </div>
                      <span className="truncate flex-1">{doc.postedBy?.fullName || "Unknown"}</span>
                      <span className="whitespace-nowrap">• {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                    </div>
                    <Link href={`/dashboard/pdf/${doc.id}`} passHref className="w-full">
                       <div className="w-full text-center bg-blue-600 text-white hover:bg-blue-700 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-blue-500/10">
                         Open Reader
                       </div>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="practice" className="mt-0 space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="text-xl font-medium font-cabin">Mock Exams & Quizzes</h3>
                 </div>
                 
                 {questionsCount > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="hover:shadow-lg transition-all border-green-100 dark:border-green-900/30 overflow-hidden relative bg-white dark:bg-zinc-950">
                        <div className="absolute right-0 top-0 p-6 opacity-[0.03]">
                          <BrainCircuit className="w-32 h-32 text-green-600" />
                        </div>
                        <CardHeader>
                          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
                            <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <CardTitle className="text-xl font-cabin">Standard Mock Exam</CardTitle>
                          <CardDescription className="font-poppins text-xs font-light">
                            A timed exam derived from {questionsCount} available past questions for this course.
                          </CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Link href={`/dashboard/cbt/session/new?courseId=${course.id}`} className="w-full">
                            <div className="w-full text-center bg-green-600 text-white hover:bg-green-700 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/20">
                              Start 50-Question Mock
                            </div>
                          </Link>
                        </CardFooter>
                      </Card>
                   </div>
                 ) : (
                   <div className="text-center p-16 bg-orange-50/20 dark:bg-orange-950/5 rounded-3xl border border-dashed border-orange-200 dark:border-orange-900/30">
                      <div className="bg-orange-100/50 dark:bg-orange-900/20 w-16 h-16 flex items-center justify-center rounded-2xl mx-auto mb-4">
                         <HelpCircle className="w-8 h-8 text-orange-500" />
                      </div>
                      <h3 className="text-lg font-bold text-orange-950 dark:text-orange-100 mb-2 font-poppins">No Questions Found</h3>
                      <p className="text-sm text-orange-800/60 dark:text-orange-200/50 max-w-sm mx-auto font-poppins mb-6 font-light">
                        There are no past questions for {course.courseCode} yet. Once materials are parsed by AI, mock exams will appear here.
                      </p>
                      <Link href={`/dashboard/requests`}>
                        <div className="inline-flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 px-6 py-2.5 rounded-xl text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm">
                          Request Past Questions
                        </div>
                      </Link>
                   </div>
                 )}
              </div>
              
              <div className="lg:col-span-4">
                 <h3 className="text-xl font-medium font-cabin mb-4">Exam Insights</h3>
                 <ExamInsightsView courseId={course.id} />
              </div>
           </div>
        </TabsContent>

        <TabsContent value="community" className="mt-0 space-y-10">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-xl font-medium font-cabin">Course Discussions</h3>
                    <Link href={`/dashboard/threads/new?courseId=${course.id}`} className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2">
                       Start a Topic
                    </Link>
                  </div>
                  
                  {threads.length === 0 ? (
                     <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 shadow-sm">
                        <Users className="w-12 h-12 text-blue-100 dark:text-zinc-800 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-1 font-cabin">No Discussions Yet</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto font-poppins font-light">
                          Be the first to start a discussion or ask a question in this workspace.
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                       {threads.map((thread: any) => (
                          <Link key={thread.id} href={`/dashboard/threads/${thread.id}`} className="block group">
                            <Card className="hover:border-blue-300 dark:hover:border-blue-900 transition-all cursor-pointer bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-900 shadow-sm">
                               <CardHeader className="pb-4 pt-5 px-6">
                                 <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 font-cabin font-normal">{thread.title}</CardTitle>
                                 <CardDescription className="flex items-center gap-2 font-poppins text-[11px] font-light">
                                   <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                     {thread.author?.fullName?.[0] || "?"}
                                   </div>
                                   <span>{thread.author?.fullName || "Unknown"}</span>
                                   <span className="text-gray-300 dark:text-zinc-800">•</span>
                                   <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                                 </CardDescription>
                               </CardHeader>
                            </Card>
                          </Link>
                       ))}
                     </div>
                  )}
              </div>
              
              <div className="lg:col-span-4 space-y-10">
                 <div>
                   <h3 className="text-xl font-medium font-cabin mb-4">Study Rooms</h3>
                   <StudyRoomsList courseId={course.id} />
                 </div>
                 
                 <div>
                   <h3 className="text-xl font-medium font-cabin mb-4">Survival Guides</h3>
                   <SurvivalGuidesList courseId={course.id} />
                 </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="tutor" className="mt-0">
           <div className="text-center p-20 bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/5 dark:to-zinc-950 rounded-[40px] border border-purple-100 dark:border-purple-900/20 relative overflow-hidden h-[500px] flex flex-col items-center justify-center">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                 <MessageSquare className="w-96 h-96 text-purple-900" />
              </div>
              <div className="bg-white dark:bg-zinc-900 w-24 h-24 flex items-center justify-center rounded-[32px] mx-auto mb-8 shadow-xl shadow-purple-500/10 border border-purple-100 dark:border-purple-900/30 relative z-10">
                 <BrainCircuit className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold text-purple-950 dark:text-purple-50 mb-4 font-cabin relative z-10">Personal AI Workspace Tutor</h3>
              <p className="text-base text-purple-900/60 dark:text-purple-300/50 max-w-xl mx-auto font-poppins font-light leading-relaxed relative z-10">
                Our AI tutor is currently indexing all materials in <b>{course.courseCode}</b> to provide you with smart answers, citations, and summaries directly from your course notes.
              </p>
              <div className="mt-8 relative z-10">
                 <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800/30">
                    <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>
                    Generating Knowledge Base...
                 </div>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>

  );
}
