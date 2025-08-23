"use client";

import {useForm, Controller, SubmitHandler} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import { ClipboardPaste, CloudUpload, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// schema
export const bookSchema = z
    .object({
      title: z.string().min(3),
      description: z.string().min(10),
      departmentId: z.string(),
      type: z.string(),
      courseIds: z.array(z.string()).nonempty(),
      source: z.enum(["file", "link"]),
      file: z
          .custom<File>((val) => val instanceof File, {
            message: "Invalid file input",
          })
          .optional(),
      link: z.string().url().optional(),
    })
    .refine(
        (data) =>
            (data.source === "file" && data.file instanceof File) ||
            (data.source === "link" && !!data.link),
        {
          message: "You must provide either a file or a link",
          path: ["file"],
        }
    );

type BookFormData = z.infer<typeof bookSchema>;

export function UploadBookForm({
                                 department,
                                 courses,
                                 setOpen,
                               }: {
  department: Department[] | null;
  courses: Course[] | undefined;
  setOpen: Function;
}) {
  const [loading, setLoading] = useState(false);

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
      file: undefined,
      link: "",
    },
  });

  const { uploadFile } = useFileUpload();
  const source = watch("source");

  const onSubmit: SubmitHandler<BookFormData> = async (data: BookFormData) => {
    setLoading(true);
    toast.info("Uploading...");

    try {
      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("departmentId", data.departmentId);
      formData.append("type", data.type);

      data.courseIds.forEach((id) => {
        formData.append("courseIds[]", id);
      });

      if (data.source === "file" && data.file ) {
        formData.append("file", data.file);
      }

      if (data.source === "link" && data.link) {
        formData.append("link", data.link); // keep key consistent with server
      }

      console.log("Form: ", formData);
      const res = await fetch("/api/books", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Book uploaded!");
        reset();
        setOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to upload book");
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
    } catch (err) {
      toast.error("Clipboard access denied");
    }
  };
  const onError = (errors: any) => {
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
              className="w-full border rounded p-2 text-xs dark:bg-gray-900 dark:border-gray-700"
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
              className="w-full border rounded p-2 text-xs dark:bg-gray-900 dark:border-gray-700"
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
              className="w-full border rounded p-2 text-xs dark:bg-gray-900 dark:border-gray-700"
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
              className="w-full border rounded p-2 text-xs dark:bg-gray-900 dark:border-gray-700"
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
                              Array.from(e.target.selectedOptions, (opt) => opt.value)
                          )
                      }
                      className="w-full border rounded p-2 text-xs dark:bg-gray-900 dark:border-gray-700"
                  >
                    {courses?.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
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
          <TabsList className="grid grid-cols-2 w-full rounded-2xl bg-gray-100 dark:bg-gray-800">
            <TabsTrigger
                value="file"
                className={cn(
                    "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 rounded-xl"
                )}
            >
              <CloudUpload className="w-4 h-4" /> Upload File
            </TabsTrigger>
            <TabsTrigger
                value="link"
                className={cn(
                    "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 rounded-xl"
                )}
            >
              <LinkIcon className="w-4 h-4" /> Paste Link
            </TabsTrigger>
          </TabsList>

          {/* File Upload */}
          <TabsContent value="file" className="mt-4">
            <label className="block font-medium">Book File</label>
            <Controller
                control={control}
                name="file"
                render={({ field }) => (
                    <input
                        type="file"
                        onChange={(e) => field.onChange(e.target.files?.[0] ?? undefined)}
                        className="w-full dark:bg-gray-900 dark:border-gray-700"
                    />
                )}
            />
            {errors.file && (
                <p className="text-red-500 text-xs">{errors.file.message}</p>
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
                  className="w-full border rounded p-2 text-xs dark:bg-gray-900 dark:border-gray-700"
              />
              <button
                  type="button"
                  onClick={handlePaste}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-700 dark:hover:bg-gray-600"
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
