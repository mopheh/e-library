"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, CloudUpload, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCourses } from "@/hooks/useCourses";

import { useCreateBook } from "@/hooks/useCreateBook";
import { Department } from "@/types";
import { FileUploadDropzone } from "@/components/shared/FileUploadDropzone";

// schema
export const bookSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(10),
    departmentId: z.string(),
    type: z.string(),
    courseIds: z.array(z.string()).nonempty(),
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

export function UploadBookForm({
  department,
  setOpen,
}: {
  department: Department[] | null;
  setOpen: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const { createBook } = useCreateBook();
  const { data: courses } = useCourses({
    limit: 2000,
  });

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
      title: "",
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

        toast.success("Book uploaded!");
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
            link: data.link,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload book");
        }

        toast.success("Book uploaded!");

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
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="font-poppins text-sm space-y-6"
    >
      {/* Title */}
      <div>
        <label className="block font-medium">Title</label>
        <input
          type="text"
          {...register("title")}
          className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
        />
        {errors.title && (
          <p className="text-red-500 text-xs">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block font-medium">Description</label>
        <textarea
          {...register("description")}
          className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
        />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="block font-medium">Type</label>
        <input
          {...register("type")}
          className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
          placeholder="e.g Past Question or Text Book or Material"
        />
        {errors.type && (
          <p className="text-red-500 text-xs">{errors.type.message}</p>
        )}
      </div>

      {/* Department */}
      <div>
        <label className="block font-medium">Department</label>
        <select
          {...register("departmentId")}
          className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
        >
          <option value="">Select department</option>
          {department?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.departmentName}
            </option>
          ))}
        </select>
        {errors.departmentId && (
          <p className="text-red-500 text-xs">{errors.departmentId.message}</p>
        )}
      </div>

      {/* Courses */}
      <div>
        <label className="block font-medium">Courses</label>
        <Controller
          control={control}
          name="courseIds"
          render={({ field }) => (
            <select
              multiple
              value={field.value}
              onChange={(e) =>
                field.onChange(
                  Array.from(e.target.selectedOptions, (opt) => opt.value),
                )
              }
              className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
            >
              {courses?.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} - {course.title}
                </option>
              ))}
            </select>
          )}
        />
        {errors.courseIds && (
          <p className="text-red-500 text-xs">{errors.courseIds.message}</p>
        )}
      </div>

      {/* Source Toggle (Tabs instead of radios) */}
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
          <label className="block font-medium mb-2">Book File</label>
          <FileUploadDropzone
             onUploadSuccess={(url, fileObj) => {
               setValue("fileUrl", url, { shouldValidate: true })
               setValue("fileSize", fileObj.size, { shouldValidate: true })
             }}
             accept=".pdf,.doc,.docx,.epub"
             maxSizeMB={50}
             label="Click or drag book file here"
          />
          {errors.fileUrl && (
            <p className="text-red-500 text-xs mt-1">{errors.fileUrl.message}</p>
          )}
        </TabsContent>

        {/* Link Upload */}
        <TabsContent value="link" className="mt-4">
          <label className="block font-medium">Google Drive Link</label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              {...register("link")}
              placeholder="https://drive.google.com/..."
              className="w-full border rounded p-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="p-2 bg-zinc-200 hover:bg-zinc-300 rounded dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              <ClipboardPaste size={16} />
            </button>
          </div>
          {errors.link && (
            <p className="text-red-500 text-xs">{errors.link.message}</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="text-xs bg-green-600 cursor-pointer text-white px-4 py-2 rounded-full w-fit mx-auto hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Book"}
      </button>
    </form>
  );
}
