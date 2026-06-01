"use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useDepartments } from "@/hooks/useDepartments";
import { Course } from "@/types";
import { Building2, ShieldCheck } from "lucide-react";

type FormData = {
  title: string;
  level: string;
  semester: "FIRST" | "SECOND";
  unitLoad: number;
  courseCode: string;
  departmentId: string;          // owner department
  borrowingDepartments: string[]; // additional departments
};

interface EditCourseFormProps {
  course: Course;
  onSuccess: () => void;
}

const EditCourseForm: React.FC<EditCourseFormProps> = ({ course, onSuccess }) => {
  const [loadingDepts, setLoadingDepts] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      title: course.title,
      level: course.level,
      semester: course.semester as any,
      unitLoad: course.unitLoad,
      courseCode: course.courseCode,
      departmentId: course.departmentId ?? "",
      borrowingDepartments: [],
    },
  });

  const queryClient = useQueryClient();

  // All departments for selects
  const { data: allDepartments = [] } = useDepartments({ limit: 300 });

  // Pre-load existing borrowing departments from the API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${course.id}`);
        if (!res.ok) return;
        const data = await res.json();
        reset((prev) => ({
          ...prev,
          borrowingDepartments: data.borrowingDepartments ?? [],
        }));
      } catch (_) {
        // silently ignore
      } finally {
        setLoadingDepts(false);
      }
    };
    load();
  }, [course.id, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: data.courseCode,
          title: data.title,
          level: data.level,
          semester: data.semester,
          unitLoad: data.unitLoad,
          departmentId: data.departmentId,
          borrowingDepartments: data.borrowingDepartments,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update course");

      toast.success("Course updated successfully", {
        description: "The course details have been saved.",
        style: { color: "#22c55e", fontWeight: "bold" },
      });

      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update course", {
        description: err.message || "Something went wrong",
        style: { color: "#ef4444", fontWeight: "bold" },
      });
    }
  };

  const inputCls =
    "w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 font-poppins pt-5 pb-2 px-2">
      <div>
        <h3 className="text-xl font-bold font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 mb-1">
          Edit Course Details
        </h3>
        <p className="text-xs text-zinc-500">Modify details for course: {course.courseCode}</p>
      </div>

      {/* Course Code */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Course Code</label>
        <input
          type="text"
          {...register("courseCode", { required: "Course code is required" })}
          placeholder="e.g. EEE531"
          className={`uppercase ${inputCls}`}
        />
        {errors.courseCode && (
          <span className="text-[10px] font-bold text-red-500">{errors.courseCode.message}</span>
        )}
      </div>

      {/* Course Title */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Course Title</label>
        <input
          type="text"
          {...register("title", { required: "Course title is required" })}
          placeholder="e.g. Energy Transmission"
          className={inputCls}
        />
        {errors.title && (
          <span className="text-[10px] font-bold text-red-500">{errors.title.message}</span>
        )}
      </div>

      {/* Level + Unit Load */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Level</label>
          <input
            type="text"
            {...register("level", { required: "Level is required" })}
            placeholder="e.g. 500"
            className={inputCls}
          />
          {errors.level && (
            <span className="text-[10px] font-bold text-red-500">{errors.level.message}</span>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Unit Load</label>
          <input
            type="number"
            {...register("unitLoad", {
              required: "Unit load is required",
              min: { value: 1, message: "Min 1" },
              max: { value: 6, message: "Max 6" },
            })}
            placeholder="e.g. 3"
            className={inputCls}
          />
          {errors.unitLoad && (
            <span className="text-[10px] font-bold text-red-500">{errors.unitLoad.message}</span>
          )}
        </div>
      </div>

      {/* Semester */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Semester</label>
        <select
          {...register("semester", { required: "Semester is required" })}
          className={inputCls}
        >
          <option value="FIRST">FIRST SEMESTER</option>
          <option value="SECOND">SECOND SEMESTER</option>
        </select>
        {errors.semester && (
          <span className="text-[10px] font-bold text-red-500">{errors.semester.message}</span>
        )}
      </div>

      {/* ── Owner Department ── */}
      <div className="space-y-2 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <label className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Owner Department
          </label>
        </div>
        <p className="text-[10px] text-zinc-500 font-poppins">
          The primary department that owns this course.
        </p>
        {loadingDepts ? (
          <div className="w-full h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
        ) : (
          <select
            {...register("departmentId", { required: "Owner department is required" })}
            className="w-full border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          >
            <option value="">— Select owner department —</option>
            {(allDepartments as any[]).map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name || dept.departmentName}
              </option>
            ))}
          </select>
        )}
        {errors.departmentId && (
          <span className="text-[10px] font-bold text-red-500">{errors.departmentId.message}</span>
        )}
      </div>

      {/* ── Borrowing Departments ── */}
      <div className="space-y-2 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-blue-500" />
          <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Borrowing Departments
          </label>
        </div>
        <p className="text-[10px] text-zinc-500 font-poppins">
          Other departments that also offer this course. Hold <kbd className="bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5 font-mono text-[9px]">Ctrl</kbd>/<kbd className="bg-zinc-200 dark:bg-zinc-700 rounded px-1 py-0.5 font-mono text-[9px]">⌘</kbd> to multi-select.
        </p>

        {loadingDepts ? (
          <div className="w-full h-28 rounded-xl bg-blue-100 dark:bg-blue-900/30 animate-pulse" />
        ) : (
          <Controller
            control={control}
            name="borrowingDepartments"
            render={({ field }) => (
              <select
                multiple
                value={field.value || []}
                onChange={(e) =>
                  field.onChange(
                    Array.from(e.target.selectedOptions, (opt) => opt.value)
                  )
                }
                className="w-full border border-blue-200 dark:border-blue-800 bg-white dark:bg-zinc-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 min-h-[7rem]"
              >
                {(allDepartments as any[]).map((dept) => (
                  <option key={dept.id} value={dept.id} className="py-1">
                    {dept.name || dept.departmentName}
                  </option>
                ))}
              </select>
            )}
          />
        )}

        {/* Selection count */}
        <Controller
          control={control}
          name="borrowingDepartments"
          render={({ field }) =>
            (field.value?.length ?? 0) > 0 ? (
              <p className="text-[10px] font-bold text-blue-500">
                {field.value.length} department{field.value.length !== 1 ? "s" : ""} selected
              </p>
            ) : (
              <p className="text-[10px] text-zinc-400">No borrowing departments selected</p>
            )
          }
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold font-cabin text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-55"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};

export default EditCourseForm;
