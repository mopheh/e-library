"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  TriangleAlert,
  X,
  Plus,
  SlidersHorizontal,
  GraduationCap,
  Clock,
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useDepartments } from "@/hooks/useDepartments";
import FormModal from "@/components/FormDialogBody";
import AddCoursesForm from "@/components/AddCourses";
import EditCourseForm from "@/components/adminDashboard/EditCourseForm";
import { SkeletonRow } from "@/components/adminDashboard/SkeletonRow";
import { Course, Department } from "@/types";

const LEVEL_COLORS: Record<string, string> = {
  "100": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "200": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "300": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "400": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "500": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "600": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const PAGE_SIZE = 10;

// --------------- Delete Confirmation Modal ---------------
function DeleteConfirmModal({
  course,
  onClose,
  onConfirm,
  loading,
}: {
  course: Course;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl p-8 w-full max-w-md"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 mb-6 mx-auto">
            <TriangleAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 text-center mb-2">
            Delete Course?
          </h2>
          <p className="text-xs text-zinc-500 font-poppins text-center leading-relaxed mb-2">
            This will permanently remove{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {course.courseCode} — {course.title}
            </span>{" "}
            and all associated data including exam insights, study rooms, and resource requests.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 text-center mb-8">
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold font-cabin text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold font-cabin text-xs uppercase tracking-widest shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --------------- Edit Slide-over Modal ---------------
function EditModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-cabin">
                  Management Hub
                </p>
                <p className="text-xs font-bold text-zinc-500 font-poppins">
                  Edit Course
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 pb-4">
            <EditCourseForm course={course} onSuccess={onClose} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --------------- Main Course Management Component ---------------
interface CourseManagementProps {
  /** If provided, scopes to a single department */
  departmentId?: string;
  departmentInfo?: Department | null;
}

const CourseManagement: React.FC<CourseManagementProps> = ({
  departmentId,
  departmentInfo,
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState(departmentId ?? "");

  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch courses (all or scoped)
  const { data: courses = [], isLoading } = useCourses({
    departmentId: selectedDeptId || undefined,
    limit: 1000,
  });

  // For department selector when in global mode
  const { data: departments = [] } = useDepartments({ limit: 200 });

  // ---- Client-side filter + search ----
  const filtered = useMemo(() => {
    return (courses as Course[]).filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.courseCode.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q);
      const matchesLevel =
        levelFilter === "ALL" || c.level === levelFilter;
      const matchesSemester =
        semesterFilter === "ALL" || c.semester === semesterFilter;
      return matchesSearch && matchesLevel && matchesSemester;
    });
  }, [courses, search, levelFilter, semesterFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 on filter change
  const updateFilter = (setter: (v: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // ---- Delete handler ----
  const handleDelete = async () => {
    if (!deleteCourse) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/courses/${deleteCourse.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete course");

      toast.success(`${deleteCourse.courseCode} deleted`, {
        description: "Course and all related data removed.",
      });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      setDeleteCourse(null);
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Department info for AddCourses form
  const deptForForm: Department[] = departmentInfo
    ? [departmentInfo]
    : selectedDeptId && departments.length > 0
    ? (() => {
        const d = (departments as any[]).find((dep) => dep.id === selectedDeptId);
        return d ? [d] : [];
      })()
    : [];

  return (
    <>
      {/* Modals */}
      {editCourse && (
        <EditModal course={editCourse} onClose={() => setEditCourse(null)} />
      )}
      {deleteCourse && (
        <DeleteConfirmModal
          course={deleteCourse}
          onClose={() => setDeleteCourse(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
      <FormModal open={addOpen} setOpen={setAddOpen}>
        {deptForForm.length > 0 ? (
          <AddCoursesForm
            department={deptForForm}
            departmentId={selectedDeptId}
          />
        ) : (
          <p className="text-xs text-zinc-500 p-4 font-poppins">
            Please select a department first before adding a course.
          </p>
        )}
      </FormModal>

      {/* Panel wrapper */}
      <div className="bg-white dark:bg-zinc-950 rounded-[3rem] shadow-sm overflow-hidden">
        {/* ---- Header ---- */}
        <div className="px-10 pt-10 pb-6 border-b border-zinc-50 dark:border-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                Courses
              </h2>
              <p className="text-xs text-zinc-500 font-poppins mt-1">
                {filtered.length} course{filtered.length !== 1 ? "s" : ""} found
                {selectedDeptId && departmentInfo?.departmentName
                  ? ` in ${departmentInfo.departmentName}`
                  : ""}
              </p>
            </div>

            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
          </div>

          {/* ---- Filters row ---- */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by code or title…"
                value={search}
                onChange={(e) => updateFilter(setSearch, e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none text-sm font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:ring-2 ring-blue-500/20"
              />
            </div>

            {/* Department selector (global mode only) */}
            {!departmentId && (
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setPage(1);
                  }}
                  className="pl-11 pr-8 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none text-sm font-poppins text-zinc-700 dark:text-zinc-300 focus:ring-2 ring-blue-500/20 appearance-none min-w-[200px]"
                >
                  <option value="">All Departments</option>
                  {(departments as any[]).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Level filter */}
            <div className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select
                value={levelFilter}
                onChange={(e) => updateFilter(setLevelFilter, e.target.value)}
                className="pl-11 pr-8 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none text-sm font-poppins text-zinc-700 dark:text-zinc-300 focus:ring-2 ring-blue-500/20 appearance-none"
              >
                <option value="ALL">All Levels</option>
                {["100", "200", "300", "400", "500", "600"].map((l) => (
                  <option key={l} value={l}>
                    {l} Level
                  </option>
                ))}
              </select>
            </div>

            {/* Semester filter */}
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select
                value={semesterFilter}
                onChange={(e) =>
                  updateFilter(setSemesterFilter, e.target.value)
                }
                className="pl-11 pr-8 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none text-sm font-poppins text-zinc-700 dark:text-zinc-300 focus:ring-2 ring-blue-500/20 appearance-none"
              >
                <option value="ALL">Both Semesters</option>
                <option value="FIRST">1st Semester</option>
                <option value="SECOND">2nd Semester</option>
              </select>
            </div>
          </div>
        </div>

        {/* ---- Table ---- */}
        <div className="px-10 py-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} columns={5} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-5 text-zinc-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold font-cabin text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                No courses found
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-poppins">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin">
                      Code
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin pl-4">
                      Title
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin pl-4">
                      Level
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin pl-4">
                      Semester
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin pl-4">
                      Units
                    </th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin pl-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                  {paginated.map((course) => (
                    <motion.tr
                      key={course.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors rounded-2xl"
                    >
                      {/* Code */}
                      <td className="py-4 pr-2">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-[10px] font-black font-cabin uppercase tracking-widest">
                          {course.courseCode}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-4 pl-4 pr-4 max-w-[260px]">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 font-poppins truncate">
                          {course.title}
                        </p>
                      </td>

                      {/* Level */}
                      <td className="py-4 pl-4">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold font-cabin uppercase tracking-wider ${
                            LEVEL_COLORS[course.level] ||
                            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {course.level}L
                        </span>
                      </td>

                      {/* Semester */}
                      <td className="py-4 pl-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-cabin">
                          {course.semester === "FIRST" ? "1st" : "2nd"}
                        </span>
                      </td>

                      {/* Unit Load */}
                      <td className="py-4 pl-4">
                        <span className="text-sm font-bold font-poppins text-zinc-700 dark:text-zinc-300">
                          {course.unitLoad}
                          <span className="text-[10px] text-zinc-400 ml-0.5 font-normal">
                            cr
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditCourse(course)}
                            title="Edit course"
                            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCourse(course)}
                            title="Delete course"
                            className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ---- Pagination ---- */}
        {totalPages > 1 && (
          <div className="px-10 pb-8 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-900 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg =
                  totalPages <= 7
                    ? i + 1
                    : page <= 4
                    ? i + 1
                    : page >= totalPages - 3
                    ? totalPages - 6 + i
                    : page - 3 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-xl text-[10px] font-black font-cabin transition-all ${
                      page === pg
                        ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-md"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CourseManagement;
