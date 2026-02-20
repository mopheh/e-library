"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createCourses } from "@/actions/course";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";
import { Department } from "@/types";

type FormData = {
  faculty: string;
  departmentId: string;
  title: string;
  level: string;
  semester: string;
  unitLoad: number;
  courseCode: string;
  departments: string[]; // borrowing departments
};

interface Props {
  department: Department[];
  departmentId: string;
}

const AddCoursesForm: React.FC<Props> = ({ department, departmentId }) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const queryClient = useQueryClient();
  const selectedFaculty = watch("faculty");
  const { data: departments } = useDepartments({ facultyId: selectedFaculty });
  const { isError, error } = useFaculties(1);

  const onSubmit = async (data: FormData) => {
    const promise = createCourses(data);

    toast.promise(promise, {
      loading: "Adding Course to departments...",
      success: {
        message: "Course added successfully",
        description: "Course has been created.",
        style: { color: "#22c55e", fontWeight: "bold" },
      },
      error: (err) => ({
        message: "Error creating course",
        description: err.message || "Something went wrong",
        style: {
          color: "#ef4444",
          fontFamily: "Josefin Sans",
          fontWeight: "bold",
        },
      }),
    });

    try {
      await promise;
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      reset();
    } catch (err) {
      console.error("Failed to create course:", err);
    }
  };

  const isDisabled = !selectedFaculty;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Faculty - Disabled */}
      <div>
        <label className="text-sm font-medium font-poppins">Faculty</label>
        <select
          {...register("faculty", { required: true })}
          disabled
          className="w-full border px-3 py-2 rounded-lg text-sm mt-1"
        >
          <option value={department[0].facultyId}>
            {department[0].facultyName}
          </option>
        </select>
      </div>

      {/* Department - Disabled */}
      <div>
        <label className="text-sm font-medium font-poppins">
          Department <i className="font-normal text-xs">(Owner)</i>
        </label>
        <select
          {...register("departmentId", { required: true })}
          disabled
          className="w-full border px-3 py-2 rounded-lg text-sm mt-1"
        >
          <option value={departmentId}>{department[0].departmentName}</option>
        </select>
      </div>

      {/* Borrowing Departments */}
      <div>
        <label className="text-sm font-medium font-poppins">
          Borrowing Departments
        </label>
        <Controller
          control={control}
          name="departments"
          render={({ field }) => (
            <select
              multiple
              value={field.value || []}
              onChange={(e) =>
                field.onChange(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
            >
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium font-poppins">Course Title</label>
        <input
          type="text"
          {...register("title", { required: true })}
          placeholder="e.g Introduction to Physics"
          disabled={isDisabled}
          className={`w-full border px-3 py-2 rounded-lg text-sm mt-1 placeholder:font-josefin-sans ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>

      {/* Level, Unit Load, Course Code */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium font-poppins">Level</label>
          <input
            type="text"
            {...register("level", { required: true })}
            placeholder="e.g 200"
            disabled={isDisabled}
            className={`w-full border px-3 py-2 rounded-lg text-sm mt-1 placeholder:font-josefin-sans ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>

        <div>
          <label className="text-sm font-medium font-poppins">Unit Load</label>
          <input
            type="number"
            {...register("unitLoad", { required: true })}
            placeholder="e.g 3"
            max={6}
            disabled={isDisabled}
            className={`w-full border px-3 py-2 rounded-lg text-sm mt-1 placeholder:font-josefin-sans ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>

        <div>
          <label className="text-sm font-medium font-poppins">
            Course Code
          </label>
          <input
            type="text"
            {...register("courseCode", { required: true })}
            placeholder="e.g EEE316"
            disabled={isDisabled}
            className={`uppercase w-full border px-3 py-2 rounded-lg text-sm mt-1 placeholder:font-josefin-sans ${
              isDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>

      {/* Semester */}
      <div>
        <label className="text-sm font-medium font-poppins">Semester</label>
        <select
          {...register("semester", { required: true })}
          disabled={isDisabled}
          className={`w-full border px-3 py-2 rounded-lg text-sm mt-1 ${
            isDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="FIRST">FIRST</option>
          <option value="SECOND">SECOND</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-green-600 w-full py-2 text-white rounded-lg hover:bg-green-700 text-xs font-poppins cursor-pointer"
      >
        Submit
      </button>
    </form>
  );
};

export default AddCoursesForm;
