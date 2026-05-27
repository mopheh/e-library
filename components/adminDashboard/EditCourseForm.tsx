"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Course } from "@/types";

type FormData = {
  title: string;
  level: string;
  semester: "FIRST" | "SECOND";
  unitLoad: number;
  courseCode: string;
};

interface EditCourseFormProps {
  course: Course;
  onSuccess: () => void;
}

const EditCourseForm: React.FC<EditCourseFormProps> = ({ course, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      title: course.title,
      level: course.level,
      semester: course.semester as any,
      unitLoad: course.unitLoad,
      courseCode: course.courseCode,
    },
  });

  const queryClient = useQueryClient();

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update course");
      }

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-poppins p-4">
      <div>
        <h3 className="text-xl font-bold font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 mb-1">
          Edit Course Details
        </h3>
        <p className="text-xs text-zinc-500 mb-6">Modify details for course: {course.courseCode}</p>
      </div>

      {/* Course Code */}
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Course Code</label>
        <input
          type="text"
          {...register("courseCode", { required: "Course code is required" })}
          placeholder="e.g. EEE531"
          className="uppercase w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {errors.title && (
          <span className="text-[10px] font-bold text-red-500">{errors.title.message}</span>
        )}
      </div>

      {/* Level, Unit Load */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Level</label>
          <input
            type="text"
            {...register("level", { required: "Level is required" })}
            placeholder="e.g. 500"
            className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              min: { value: 1, message: "Min unit load is 1" },
              max: { value: 6, message: "Max unit load is 6" }
            })}
            placeholder="e.g. 3"
            className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="FIRST">FIRST SEMESTER</option>
          <option value="SECOND">SECOND SEMESTER</option>
        </select>
        {errors.semester && (
          <span className="text-[10px] font-bold text-red-500">{errors.semester.message}</span>
        )}
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
