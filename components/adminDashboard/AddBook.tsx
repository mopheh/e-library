"use client"

import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useFileUpload } from "@/hooks/useFileUpload"
import { toast } from "sonner"

export const bookSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  departmentId: z.string(),
  type: z.string(),
  courseIds: z.array(z.string()).nonempty(),
  file: z.any(),
})

type BookFormData = z.infer<typeof bookSchema>

export function UploadBookForm({
  department,
  courses,
  setOpen,
}: {
  department: Department[] | null
  courses: Course[] | undefined
  setOpen: Function
}) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: "",
      type: "",
      courseIds: [],
      file: null,
    },
  })
  const { uploading, uploadFile } = useFileUpload()

  const onSubmit = async (data: BookFormData) => {
    setLoading(uploading)
    toast.info("Uploading")
    try {
      const file = data.file[0]
      console.log(file)
      console.log(data)
      const fileUrl = await uploadFile(file)
      const payload = {
        title: data.title,
        description: data.description,
        departmentId: data.departmentId,
        type: data.type,
        courseIds: data.courseIds,
        fileUrl, // URL from Firebase
      }
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success("Book uploaded!")
        reset()
      } else {
        toast.error("Failed to upload book")
      }
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="font-poppins text-sm space-y-6"
    >
      <div>
        <label className="block font-medium">Title</label>
        <input
          type="text"
          {...register("title")}
          className="w-full border rounded p-2 text-xs"
        />
        {errors.title && (
          <p className="text-red-500 text-xs">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block font-medium">Description</label>
        <textarea
          {...register("description")}
          className="w-full border rounded p-2 text-xs"
        />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>
      <div>
        <label className="block font-medium">Type</label>
        <input
          {...register("type")}
          className="w-full border rounded p-2 text-xs"
          placeholder="e.g Past Question or Text Book or Material"
        />
        {errors.type && (
          <p className="text-red-500 text-xs">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label className="block font-medium">Department</label>
        <select
          {...register("departmentId")}
          className="w-full border rounded p-2 text-xs"
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
              className="w-full border rounded p-2 text-xs"
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

      <div>
        <label className="block font-medium">Book File</label>
        <input type="file" {...register("file")} className="w-full" />
        {uploading}
        {errors.file && (
          <p className="text-red-500 text-xs">File is required</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="text-xs bg-green-600 cursor-pointer text-white px-4 py-2 rounded-full w-fit mx-auto hover:bg-green-700"
      >
        {loading ? "Uploading..." : "Upload Book"}
      </button>
    </form>
  )
}
