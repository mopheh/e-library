"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardPaste,
  CloudUpload,
  Link as LinkIcon,
  Lock,
  Search,
  CheckCircle2,
  Loader2,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCourses } from "@/hooks/useCourses";

import { useCreateBook } from "@/hooks/useCreateBook";
import { Department } from "@/types";
import { FileUploadDropzone } from "@/components/shared/FileUploadDropzone";
import { useUserData } from "@/hooks/useUsers";
import { BOOK_TYPES, TYPE_STYLES } from "@/lib/bookTypes";

// schema
export const bookSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(10),
    departmentId: z.string().min(1, "Select a department"),
    type: z.string().min(1, "Select a resource type"),
    courseIds: z.array(z.string()).nonempty("Select at least one course"),
    source: z.enum(["file", "link"]),
    fileUrl: z.string().optional(),
    fileSize: z.number().optional(),
    link: z.string().url().or(z.literal("")).optional(),
  })
  .refine(
    (data) => (data.source === "file" ? !!data.fileUrl : true),
    {
      message: "Please upload a file first",
      path: ["fileUrl"],
    },
  )
  .refine((data) => (data.source === "link" ? !!data.link : true), {
    message: "Link is required when source is link",
    path: ["link"],
  });

type BookFormData = z.infer<typeof bookSchema>;

const inputClass =
  "w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl text-sm font-poppins outline-none focus:ring-2 ring-blue-500/20 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin";
const errorClass = "text-red-500 text-[11px] mt-1";

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
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialTitle || "",
      description: "",
      departmentId: "",
      type: "",
      courseIds: [],
      source: "file",
      fileUrl: undefined,
      fileSize: undefined,
      link: "",
    },
  });

  const source = watch("source");
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
      setValue("courseIds", [] as unknown as [string, ...string[]]);
    }
    prevDepartmentRef.current = effectiveDepartmentId;
  }, [effectiveDepartmentId, setValue]);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.courseCode.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
    );
  }, [courses, courseSearch]);

  const lockedDepartment = department?.find((d) => d.id === userData?.departmentId);
  const lockedDepartmentName =
    lockedDepartment?.departmentName || lockedDepartment?.name || "your department";

  const onSubmit: SubmitHandler<BookFormData> = async (data) => {
    setLoading(true);
    toast.info("Uploading...");

    try {
      if (data.source === "file" && data.fileUrl) {
        await createBook({
          fileUrl: data.fileUrl,
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
        return;
      }

      if (data.source === "link" && data.link) {
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            departmentId: data.departmentId,
            type: data.type,
            courseIds: data.courseIds,
            fileUrl: data.link,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload book");
        }

        toast.success(uploadSuccessMessage);

        reset();
        setOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue("link", text);
        toast.success("Pasted from clipboard");
      }
    } catch {
      toast.error("Clipboard access denied");
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
          <label className={labelClass}>Title</label>
          <input
            type="text"
            placeholder="e.g. Introduction to Circuit Theory"
            {...register("title")}
            className={inputClass}
          />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className={labelClass}>Description</label>
          <textarea
            placeholder="What's this resource about?"
            rows={3}
            {...register("description")}
            className={cn(inputClass, "resize-none")}
          />
          {errors.description && <p className={errorClass}>{errors.description.message}</p>}
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
              {watch("courseIds")?.length || 0} selected
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
            <p className="text-xs text-zinc-400 italic px-1">
              No courses found for this department yet — ask an admin to add one first.
            </p>
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
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                              active
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700",
                            )}
                            title={course.title}
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
            </>
          )}
          {errors.courseIds && <p className={errorClass}>{errors.courseIds.message}</p>}
        </div>

        {/* Source Toggle (Tabs instead of radios) */}
        <div className="space-y-1.5">
          <label className={labelClass}>Source</label>
          <Tabs
            value={source}
            onValueChange={(val) => setValue("source", val as "file" | "link")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <TabsTrigger
                value="file"
                className={cn(
                  "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 rounded-xl",
                )}
              >
                <CloudUpload className="w-4 h-4" /> Upload File
              </TabsTrigger>
              <TabsTrigger
                value="link"
                className={cn(
                  "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 rounded-xl",
                )}
              >
                <LinkIcon className="w-4 h-4" /> Paste Link
              </TabsTrigger>
            </TabsList>

            {/* File Upload */}
            <TabsContent value="file" className="mt-4">
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
            </TabsContent>

            {/* Link Upload */}
            <TabsContent value="link" className="mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  {...register("link")}
                  placeholder="https://drive.google.com/..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-2xl dark:bg-zinc-800 dark:hover:bg-zinc-700 shrink-0 transition-colors"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={16} />
                </button>
              </div>
              {errors.link && <p className={errorClass}>{errors.link.message}</p>}
            </TabsContent>
          </Tabs>
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
