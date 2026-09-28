"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Lock,
  Search,
  CheckCircle2,
  Loader2,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourses } from "@/hooks/useCourses";

import { CreateBookError, useCreateBook } from "@/hooks/useCreateBook";
import { Department } from "@/types";
import { FileUploadDropzone } from "@/components/shared/FileUploadDropzone";
import { QuickAddCourse } from "./QuickAddCourse";
import { useUserData } from "@/hooks/useUsers";
import { BOOK_TYPES, TYPE_STYLES } from "@/lib/bookTypes";
import { MAX_COURSES_PER_MATERIAL, courseCodeKey, materialDetailsSchema } from "@/lib/validation/contribution";

// Same rules the API enforces (lib/validation/contribution), plus the file.
export const bookSchema = materialDetailsSchema
  .extend({
    fileUrl: z.string().optional(),
    fileSize: z.number().optional(),
  })
  .refine((data) => !!data.fileUrl, {
    message: "Please upload a file first",
    path: ["fileUrl"],
  });

type BookFormInput = z.input<typeof bookSchema>;
type BookFormData = z.output<typeof bookSchema>;

// Server field errors we can pin to an input; anything else becomes a toast.
const FIELD_NAMES = { title: 1, description: 1, type: 1, departmentId: 1, courseIds: 1, fileUrl: 1 };

const inputClass =
  "w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl text-sm font-poppins outline-none focus:ring-2 ring-blue-500/20 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin";
const errorClass = "text-red-500 text-[11px] mt-1";
const hintClass = "text-zinc-400 text-[11px] mt-1";
const errorInputClass = "border-red-400 dark:border-red-800 ring-2 ring-red-500/15";

function CharCount({ value, max }: { value?: string; max: number }) {
  const n = value?.length ?? 0;
  return (
    <span className={cn("text-[10px] tabular-nums", n > max * 0.9 ? "text-amber-600" : "text-zinc-400")}>
      {n}/{max}
    </span>
  );
}

export function UploadBookForm({
  department,
  setOpen,
  departmentId,
  initialTitle,
}: {
  department: Department[] | null;
  setOpen: (open: boolean) => void;
  /** When provided, seeds the initial course list before a department is chosen. */
  departmentId?: string;
  /** Pre-fills the title, e.g. when opened from a "can't find this?" search nudge. */
  initialTitle?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const { createBook } = useCreateBook();
  const { data: userData } = useUserData();
  const isAdmin = userData?.role === "ADMIN";
  const isStudent = userData?.role === "STUDENT";
  const userLoaded = !!userData;

  const uploadSuccessMessage = isAdmin
    ? "Book uploaded!"
    : "Submitted for review — an admin will approve it before it goes live.";

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
    setError,
  } = useForm<BookFormInput, unknown, BookFormData>({
    resolver: zodResolver(bookSchema),
    // Validate a field once the user leaves it, then live while they fix it.
    mode: "onTouched",
    defaultValues: {
      title: initialTitle || "",
      description: "",
      departmentId: "",
      type: undefined,
      courseIds: [],
      fileUrl: undefined,
      fileSize: undefined,
    },
  });

  const selectedType = watch("type");
  const selectedDepartmentId = watch("departmentId");

  // Students can only ever contribute to their own department — lock it in
  // as soon as we know who they are, instead of letting them pick freely.
  useEffect(() => {
    if (isStudent && userData?.departmentId && !selectedDepartmentId) {
      setValue("departmentId", userData.departmentId, { shouldValidate: true });
    }
  }, [isStudent, userData?.departmentId, selectedDepartmentId, setValue]);

  const effectiveDepartmentId = isStudent
    ? userData?.departmentId
    : selectedDepartmentId || departmentId;

  const { data: courses, isLoading: coursesLoading } = useCourses(
    effectiveDepartmentId
      ? { departmentId: effectiveDepartmentId, limit: 2000, includeBorrowed: true }
      : { limit: 2000 },
  );

  // Whenever the effective department actually changes (an admin/rep picking
  // a different one), the previously-selected courses no longer apply.
  const prevDepartmentRef = useRef(effectiveDepartmentId);
  useEffect(() => {
    if (prevDepartmentRef.current && prevDepartmentRef.current !== effectiveDepartmentId) {
      setValue("courseIds", []);
    }
    prevDepartmentRef.current = effectiveDepartmentId;
  }, [effectiveDepartmentId, setValue]);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    // "csc201" should still find "CSC 201".
    const qKey = courseCodeKey(q);
    return courses.filter(
      (c) =>
        (qKey && courseCodeKey(c.courseCode).includes(qKey)) || c.title.toLowerCase().includes(q),
    );
  }, [courses, courseSearch]);

  const lockedDepartment = department?.find((d) => d.id === userData?.departmentId);
  const lockedDepartmentName =
    lockedDepartment?.departmentName || lockedDepartment?.name || "your department";

  const effectiveDepartment = department?.find((d) => d.id === effectiveDepartmentId);
  const effectiveDepartmentName =
    effectiveDepartment?.departmentName || effectiveDepartment?.name || "this department";

  const selectAddedCourse = (course: { id: string }) => {
    const current = getValues("courseIds") || [];
    if (!current.includes(course.id)) {
      setValue("courseIds", [...current, course.id], { shouldValidate: true });
    }
    setCourseSearch("");
  };

  const onSubmit: SubmitHandler<BookFormData> = async (data) => {
    setLoading(true);
    toast.info("Uploading...");

    try {
      await createBook({
        fileUrl: data.fileUrl!,
        title: data.title,
        description: data.description,
        departmentId: data.departmentId,
        type: data.type,
        courseIds: data.courseIds,
        fileSize: data.fileSize,
      });

      toast.success(uploadSuccessMessage);
      reset();
      setOpen(false);
    } catch (err) {
      console.error(err);
      if (err instanceof CreateBookError) {
        const fields = Object.entries(err.fieldErrors).filter(([f]) => f in FIELD_NAMES);
        fields.forEach(([field, message], i) =>
          setError(field as keyof BookFormInput, { message }, { shouldFocus: i === 0 }),
        );
        toast.error(fields.length ? "Please fix the highlighted fields" : err.message);
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: unknown) => {
    console.error("❌ validation failed", errors);
  };

  return (
    <div className="font-poppins">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black font-cabin uppercase tracking-tight text-zinc-900 dark:text-zinc-50">
            Contribute a Resource
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isAdmin
              ? "Publishes immediately once submitted."
              : "A faculty rep or admin will review this before it goes live."}
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 mb-5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          You&apos;ll get a notification the moment this is approved or rejected.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)} className="text-sm space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={labelClass} htmlFor="material-title">Title</label>
            <CharCount value={watch("title")} max={120} />
          </div>
          <input
            id="material-title"
            type="text"
            placeholder="e.g. EEE316 Past Questions 2019/2020"
            maxLength={120}
            aria-invalid={!!errors.title}
            {...register("title")}
            className={cn(inputClass, errors.title && errorInputClass)}
          />
          {errors.title ? (
            <p role="alert" className={errorClass}>{errors.title.message}</p>
          ) : (
            <p className={hintClass}>Be specific: course, topic or year. No links, phone numbers or emoji.</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={labelClass} htmlFor="material-description">Description</label>
            <CharCount value={watch("description")} max={1000} />
          </div>
          <textarea
            id="material-description"
            placeholder="What does it cover? e.g. Chapters 1–5 on network theorems, with worked examples."
            rows={3}
            maxLength={1000}
            aria-invalid={!!errors.description}
            {...register("description")}
            className={cn(inputClass, "resize-none", errors.description && errorInputClass)}
          />
          {errors.description && <p role="alert" className={errorClass}>{errors.description.message}</p>}
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className={labelClass}>Type</label>
          <div className="flex flex-wrap gap-2">
            {BOOK_TYPES.map((t) => {
              const style = TYPE_STYLES[t];
              const active = selectedType === t;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setValue("type", t, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-all",
                    active
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  {style.icon}
                  {style.label}
                </button>
              );
            })}
          </div>
          {errors.type && <p className={errorClass}>{errors.type.message}</p>}
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className={labelClass}>Department</label>
          {!userLoaded ? (
            <div className="h-[46px] rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ) : isStudent ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-semibold truncate">{lockedDepartmentName}</span>
              <span className="ml-auto text-[10px] text-zinc-400 shrink-0">Locked to your dept.</span>
            </div>
          ) : (
            <select {...register("departmentId")} className={inputClass}>
              <option value="">Select department</option>
              {department?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName || dept.name}
                </option>
              ))}
            </select>
          )}
          {errors.departmentId && <p className={errorClass}>{errors.departmentId.message}</p>}
        </div>

        {/* Courses */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Courses</label>
            <span className="text-[10px] text-zinc-400">
              {watch("courseIds")?.length || 0}/{MAX_COURSES_PER_MATERIAL} selected
            </span>
          </div>

          {!effectiveDepartmentId ? (
            <p className="text-xs text-zinc-400 italic px-1">
              Pick a department to see its courses.
            </p>
          ) : coursesLoading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 px-1 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading courses…
            </div>
          ) : !courses?.length ? (
            <>
              <p className="text-xs text-zinc-500 px-1">
                {effectiveDepartmentName} doesn&apos;t have any courses yet. Add the one this material is for.
              </p>
              <QuickAddCourse
                key={effectiveDepartmentId}
                departmentId={effectiveDepartmentId}
                departmentName={effectiveDepartmentName}
                defaultOpen
                onAdded={selectAddedCourse}
              />
            </>
          ) : (
            <>
              {courses.length > 8 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search courses…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
              )}
              <Controller
                control={control}
                name="courseIds"
                render={({ field }) => (
                  <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5 p-1 -m-1">
                    {filteredCourses.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic px-1">
                        No courses match &quot;{courseSearch}&quot;.
                      </p>
                    ) : (
                      filteredCourses.map((course) => {
                        const active = field.value.includes(course.id);
                        const atLimit = !active && field.value.length >= MAX_COURSES_PER_MATERIAL;
                        return (
                          <button
                            type="button"
                            key={course.id}
                            onClick={() =>
                              field.onChange(
                                active
                                  ? field.value.filter((id) => id !== course.id)
                                  : [...field.value, course.id],
                              )
                            }
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                              active
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700",
                            )}
                            title={atLimit ? `You can tag up to ${MAX_COURSES_PER_MATERIAL} courses` : course.title}
                            disabled={atLimit}
                          >
                            {active && <CheckCircle2 className="w-3 h-3" />}
                            {course.courseCode}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              />
              <QuickAddCourse
                key={effectiveDepartmentId}
                departmentId={effectiveDepartmentId}
                departmentName={effectiveDepartmentName}
                initialQuery={courseSearch}
                onAdded={selectAddedCourse}
              />
            </>
          )}
          {errors.courseIds && <p className={errorClass}>{errors.courseIds.message}</p>}
        </div>

        {/* File */}
        <div className="space-y-1.5">
          <label className={labelClass}>File</label>
          <FileUploadDropzone
            onUploadSuccess={(url, fileObj) => {
              setValue("fileUrl", url, { shouldValidate: true });
              setValue("fileSize", fileObj.size, { shouldValidate: true });
            }}
            accept=".pdf,.doc,.docx,.epub"
            maxSizeMB={50}
            label="Click or drag book file here"
          />
          {errors.fileUrl && <p className={errorClass}>{errors.fileUrl.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-sm shadow-blue-600/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {loading ? "Uploading…" : isAdmin ? "Publish Resource" : "Submit for Review"}
        </button>
      </form>
    </div>
  );
}
