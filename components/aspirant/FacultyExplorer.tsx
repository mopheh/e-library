"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Search,
  ArrowLeft,
  BookOpen,
  Layers,
  Lock,
  Users,
  Star,
  ArrowRight,
  BookA,
  FileText,
  PlayCircle,
  Atom,
  Briefcase,
  Scale,
  Activity,
  Sparkles,
  BookMarked,
  HelpCircle,
  FolderOpen,
  MapPin,
  ChevronRight,
  Clock,
  ArrowUpRight,
  LockOpen
} from "lucide-react";
import UpgradePromptModal from "./UpgradePromptModal";
import Link from "next/link";
import { useUserData } from "@/hooks/useUsers";
import { getFacultiesWithStats, getDepartmentsOfFaculty, getDepartmentPreview } from "@/actions/preview";
import { getDepartmentWithFaculty } from "@/actions/department";

interface Faculty {
  id: string;
  name: string;
  departmentCount: number;
}

interface Department {
  id: string;
  name: string;
  facultyId: string;
  stats: {
    booksCount: number;
    studentsCount: number;
  };
}

interface FacultyExplorerProps {
  initialDepartmentId?: string | null;
}

export default function FacultyExplorer({ initialDepartmentId }: FacultyExplorerProps) {
  const { data: userData } = useUserData();
  const role = userData?.role?.toLowerCase() || "student";
  const isAspirant = role === "aspirant";

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [facultiesLoading, setFacultiesLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load faculties on mount
  useEffect(() => {
    async function loadFaculties() {
      try {
        const res = await getFacultiesWithStats();
        if (res.success && res.data) {
          setFaculties(res.data);
          
          // If there is an initial department ID, find its faculty and auto-select
          if (initialDepartmentId) {
            const deptInfo = await getDepartmentWithFaculty(initialDepartmentId);
            if (deptInfo) {
              const matchedFaculty = res.data.find(f => f.id === deptInfo.facultyId);
              if (matchedFaculty) {
                setSelectedFaculty(matchedFaculty);
                // Load departments of that faculty
                setDepartmentsLoading(true);
                const deptRes = await getDepartmentsOfFaculty(matchedFaculty.id);
                if (deptRes.success && deptRes.data) {
                  setDepartmentsList(deptRes.data);
                }
                setDepartmentsLoading(false);
                
                // Fetch the preview details of the target department
                setPreviewLoading(true);
                const previewRes = await getDepartmentPreview(initialDepartmentId);
                if (previewRes.success && previewRes.data) {
                  setSelectedDepartment(previewRes.data);
                }
                setPreviewLoading(false);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load faculties:", err);
      } finally {
        setFacultiesLoading(false);
      }
    }
    loadFaculties();
  }, [initialDepartmentId]);

  // Load departments when faculty changes
  const handleFacultySelect = async (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment(null); // Clear selected department
    setDeptSearchQuery("");
    setDepartmentsLoading(true);
    try {
      const res = await getDepartmentsOfFaculty(faculty.id);
      if (res.success && res.data) {
        setDepartmentsList(res.data);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Load department details (preview)
  const handleDepartmentSelect = async (deptId: string) => {
    setPreviewLoading(true);
    try {
      const res = await getDepartmentPreview(deptId);
      if (res.success && res.data) {
        setSelectedDepartment(res.data);
      }
    } catch (err) {
      console.error("Failed to load department preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Helper to map Faculty Name to Icon and Gradient
  const getFacultyVisuals = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("science") || lower.includes("physical")) {
      return {
        icon: Atom,
        gradient: "from-cyan-500/20 to-blue-600/20 text-cyan-500 dark:text-cyan-400 border-cyan-500/30",
        solidGrad: "from-cyan-500 to-blue-600",
        badge: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30",
        illustration: "radial-gradient(circle at top right, var(--color-cyan-900), var(--color-zinc-900), black)"
      };
    }
    if (lower.includes("engineer") || lower.includes("tech")) {
      return {
        icon: Layers,
        gradient: "from-orange-500/20 to-red-600/20 text-orange-500 dark:text-orange-400 border-orange-500/30",
        solidGrad: "from-orange-500 to-red-600",
        badge: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
        illustration: "radial-gradient(circle at top right, var(--color-orange-900), var(--color-zinc-900), black)"
      };
    }
    if (lower.includes("law")) {
      return {
        icon: Scale,
        gradient: "from-amber-500/20 to-yellow-600/20 text-amber-500 dark:text-amber-400 border-amber-500/30",
        solidGrad: "from-amber-600 to-yellow-500",
        badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
        illustration: "radial-gradient(circle at top right, var(--color-amber-900), var(--color-zinc-900), black)"
      };
    }
    if (lower.includes("education")) {
      return {
        icon: GraduationCap,
        gradient: "from-emerald-500/20 to-teal-600/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/30",
        solidGrad: "from-emerald-500 to-teal-600",
        badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
        illustration: "radial-gradient(circle at top right, var(--color-emerald-900), var(--color-zinc-900), black)"
      };
    }
    if (lower.includes("manage") || lower.includes("business") || lower.includes("administr")) {
      return {
        icon: Briefcase,
        gradient: "from-purple-500/20 to-indigo-600/20 text-purple-500 dark:text-purple-400 border-purple-500/30",
        solidGrad: "from-purple-500 to-indigo-600",
        badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
        illustration: "radial-gradient(circle at top right, var(--color-purple-900), var(--color-zinc-900), black)"
      };
    }
    if (lower.includes("pharmacy") || lower.includes("life") || lower.includes("medicin") || lower.includes("health")) {
      return {
        icon: Activity,
        gradient: "from-pink-500/20 to-rose-600/20 text-pink-500 dark:text-pink-400 border-pink-500/30",
        solidGrad: "from-pink-500 to-rose-600",
        badge: "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/30",
        illustration: "radial-gradient(circle at top right, var(--color-pink-900), var(--color-zinc-900), black)"
      };
    }
    return {
      icon: GraduationCap,
      gradient: "from-blue-500/20 to-indigo-600/20 text-blue-500 dark:text-blue-400 border-blue-500/30",
      solidGrad: "from-blue-500 to-indigo-600",
      badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
      illustration: "radial-gradient(circle at top right, var(--color-blue-900), var(--color-zinc-900), black)"
    };
  };

  // Filter faculties by search query
  const filteredFaculties = faculties.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter departments of active faculty by search query
  const filteredDepartments = departmentsList.filter(d =>
    d.name.toLowerCase().includes(deptSearchQuery.toLowerCase())
  );

  // Department Stats
  const deptStats = selectedDepartment ? [
    { label: "Academic Resources", value: selectedDepartment.stats.recommendedTexts, icon: BookA, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Past Questions", value: `${selectedDepartment.stats.pastQuestions}+`, icon: FileText, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
    { label: "Active Students", value: selectedDepartment.stats.currentStudents, icon: Users, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
  ] : [];

  const coreCourses = selectedDepartment?.coreCourses?.length > 0
    ? selectedDepartment.coreCourses
    : ["General Physics I", "General Mathematics I", "General Chemistry I", "Use of English", "Introduction to Computing"];

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins space-y-8 text-zinc-900 dark:text-zinc-100">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> University Curriculum
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-open-sans tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            Faculties &amp; Departments
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mt-1 leading-relaxed">
            Explore active faculties, drill down into department stats, and preview course outlines and resources.
          </p>
        </div>

        {/* Global Search (when not deep in a department view) */}
        {!selectedDepartment && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder={selectedFaculty ? "Search departments..." : "Search faculties..."}
              value={selectedFaculty ? deptSearchQuery : searchQuery}
              onChange={(e) => selectedFaculty ? setDeptSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: FACULTY LIST */}
        {!selectedFaculty && (
          <motion.div
            key="faculties-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {facultiesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-3xl bg-zinc-200/60 dark:bg-zinc-900/60 animate-pulse border border-zinc-200/40 dark:border-zinc-800/40" />
              ))
            ) : filteredFaculties.length > 0 ? (
              filteredFaculties.map((fac) => {
                const visuals = getFacultyVisuals(fac.name);
                const FacIcon = visuals.icon;
                return (
                  <motion.div
                    key={fac.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => handleFacultySelect(fac)}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/40 p-6 shadow-sm hover:shadow-xl dark:hover:border-blue-500/20 transition-all duration-300 flex flex-col justify-between min-h-[180px]"
                  >
                    {/* Background Soft Glow */}
                    <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-32 h-32 rounded-full bg-blue-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div className={`p-3 rounded-2xl border ${visuals.gradient}`}>
                        <FacIcon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 px-2.5 py-1 rounded-full">
                        {fac.departmentCount} {fac.departmentCount === 1 ? "Dept" : "Depts"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold text-base md:text-lg group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {fac.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-2 font-medium">
                        Explore Departments <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center">
                <FolderOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">No faculties found</h3>
                <p className="text-zinc-400 text-sm">Try searching for a different keyword.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: DEPARTMENTS IN SELECTED FACULTY */}
        {selectedFaculty && !selectedDepartment && (
          <motion.div
            key="departments-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Faculty Info & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 p-4 rounded-3xl shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedFaculty(null)}
                  className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-2xl text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Active Faculty</span>
                  <h2 className="font-extrabold text-lg md:text-xl font-open-sans leading-tight">
                    {selectedFaculty.name}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 px-4 py-2 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                <Layers className="w-3.5 h-3.5" /> {filteredDepartments.length} Departments listed
              </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departmentsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-3xl bg-zinc-200/60 dark:bg-zinc-900/60 animate-pulse border border-zinc-200/40 dark:border-zinc-800/40" />
                ))
              ) : filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <motion.div
                    key={dept.id}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => handleDepartmentSelect(dept.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/50 p-5 shadow-sm hover:shadow-lg dark:hover:border-blue-500/20 transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <h3 className="font-bold text-sm md:text-base group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {dept.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1">100-level core outlines ready</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <BookOpen className="w-3 h-3 text-zinc-400" /> {dept.stats?.booksCount ?? 0} Texts
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Users className="w-3 h-3 text-zinc-400" /> {dept.stats?.studentsCount ?? 0} Students
                        </div>
                      </div>
                      
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-600 group-hover:text-white rounded-xl text-blue-500 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <FolderOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg">No departments found</h3>
                  <p className="text-zinc-400 text-sm">No matches inside this faculty.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: DETAILED DEPARTMENT PREVIEW */}
        {selectedFaculty && selectedDepartment && (
          <motion.div
            key="department-details-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {/* Header / Navigator */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setSelectedDepartment(null)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Departments
              </button>

              {/* Status indicator / verification link */}
              {isAspirant && (
                <Link href="/verify">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors">
                    <Star className="w-3.5 h-3.5" /> Intend Department
                  </button>
                </Link>
              )}
            </div>

            {previewLoading ? (
              <div className="flex items-center justify-center py-20">
                <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Hero Header */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-850 text-white p-6 md:p-10 shadow-2xl"
                >
                  <div className="absolute inset-0 opacity-45 mix-blend-overlay pointer-events-none">
                    <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-zinc-900 to-black" />
                  </div>

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold mb-5">
                        <GraduationCap className="w-3.5 h-3.5" /> {selectedFaculty.name}
                      </div>
                      <h1 className="text-2xl md:text-4xl font-extrabold font-open-sans mb-3 leading-tight tracking-tight">
                        {selectedDepartment.department.name}
                      </h1>
                      <p className="text-zinc-400 text-sm mb-6 max-w-md leading-relaxed">
                        View core outlines, first-year lecture guides, past question records, and peer channels.
                      </p>
                      <div className="flex gap-4">
                        <Link href="/connect">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-900/20">
                            Connect with Peers <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {deptStats.map((s, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm text-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-white bg-white/10`}>
                            <s.icon className="w-4 h-4" />
                          </div>
                          <div className="text-xl md:text-2xl font-bold">{s.value}</div>
                          <div className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column (Courses & Resources) */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Core Courses */}
                    <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl shadow-sm border border-zinc-150 dark:border-zinc-800">
                      <h3 className="text-lg font-bold font-open-sans mb-5 flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Core 100-Level Courses
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {coreCourses.map((sub: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-850 hover:border-blue-500/20 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-all">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                              {String(i + 1).padStart(2, "0")}
                            </div>
                            <span className="text-xs md:text-sm font-semibold">{sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resources & Mock CBT locker preview */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold font-open-sans flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Department Resources
                      </h3>

                      {[
                        { title: "First Semester Lecture Notes", count: selectedDepartment.stats.recommendedTexts, type: "PDF Documents", icon: FileText },
                        { title: "Mocks and Past Questions", count: selectedDepartment.stats.pastQuestions, type: "CBT Exams", icon: BookA },
                        { title: "Introductory Video Lectures", count: 8, type: "Video Guides", icon: PlayCircle },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => isAspirant ? setShowUpgradeModal(true) : undefined}
                          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 p-5 flex items-center justify-between cursor-pointer hover:border-blue-500/20 dark:hover:bg-zinc-850 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-4 z-10">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm md:text-base leading-tight">{item.title}</h4>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{item.count} items • {item.type}</span>
                            </div>
                          </div>

                          <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-150 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
                            {isAspirant ? <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:text-white" /> : <LockOpen className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column (Community Highlights) */}
                  <div className="space-y-8">
                    
                    {/* Faculty Rep / Senior Voices */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-900/50 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-850 h-fit relative overflow-hidden">
                      <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 pointer-events-none">
                        <Users className="w-24 h-24" />
                      </div>
                      
                      <h3 className="font-extrabold text-sm md:text-base mb-5 flex items-center gap-2">
                        <Users className="text-blue-600 w-4 h-4" /> Community Board
                      </h3>

                      <div className="space-y-4">
                        {[
                          { name: "Chinedu Okafor", level: "400 Level", msg: "Focus heavily on foundational courses — it's the bedrock for what comes next!" },
                          { name: "Amina Musa", level: "205 Level", msg: "Consistent practice takes you further. Don't leave it until exam week." },
                        ].map((s, i) => (
                          <div key={i} className="bg-white dark:bg-zinc-950 p-4 rounded-2xl shadow-sm border border-zinc-150 dark:border-zinc-850">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-xs">{s.name}</span>
                              <span className="text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-transparent">
                                {s.level}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 italic leading-relaxed">&quot;{s.msg}&quot;</p>
                          </div>
                        ))}

                        {isAspirant ? (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full py-3.5 border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-blue-500 rounded-2xl text-zinc-500 dark:text-zinc-400 text-xs font-semibold hover:text-blue-600 dark:hover:text-blue-400 bg-white/40 dark:bg-transparent transition-all flex items-center justify-center gap-2"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-500" /> View Peer Directory
                          </button>
                        ) : (
                          <Link
                            href="/connect"
                            className="w-full py-3.5 border border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 rounded-2xl text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Users className="w-3.5 h-3.5" /> Peer Directory
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
