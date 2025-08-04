"use client"
import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { createUser } from "@/actions/auth"
import { useFaculties } from "@/hooks/useFaculties"
import { toast } from "sonner"
import { useDepartments } from "@/hooks/useDepartments"
type FormData = {
  matric: string
  faculty: string
  department: string
  year: string
  tel: string
}
const Onboarding = () => {
  const { data: faculties, isError, error } = useFaculties(0, 1000)
  useEffect(() => {
    if (isError) {
      toast.error("Something went wrong", {
        description: error?.message || "Unable to fetch faculties",
        style: {
          color: "#ef4444",
          fontFamily: "Josefin Sans",
          fontWeight: "bold",
        },
      })
    }
  }, [isError])
  const { user } = useUser()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const selectedFaculty = watch("faculty")
  const { data: departments, isLoading: loadingDepartments } = useDepartments({
    facultyId: selectedFaculty,
  })

  const onSubmit = async (data: FormData) => {
    //@ts-ignore
    const promise = createUser({
      //@ts-ignore
      clerkId: user?.id,
      email: user?.emailAddresses[0].emailAddress,
      fullName: `${user?.firstName} ${user?.lastName}`,
      facultyId: data?.faculty,
      departmentId: data?.department,
      year: data?.year,
      matricNo: data?.matric,
      onboarded: true,
    })
    toast.promise(promise, {
      loading: "Creating User..",
      success: {
        message: `User created Successfully`,
        description: "Signing in to dashboard, Please wait.",
        style: {
          color: "#22c55e",
          fontWeight: "bold",
        },
      },
      error: (err) => ({
        message: "Error creating User",
        description: err.message || "Something went wrong",
        style: {
          color: "#ef4444",
          fontFamily: "Josefin Sans",
          fontWeight: "bold",
        },
      }),
    })

    await promise

    await user?.update({
      unsafeMetadata: {
        ...data,
        role: "student",
        onboarded: true,
      },
    })

    router.push("/dashboard/student")
  }
  return (
    <div className="w-[60%] py-5 px-8 bg-white shadow-xl rounded-lg">
      <h1 className={`text-xl font-bold mb-4 font-karla`}>
        Complete Your Profile
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 grid grid-cols-3 gap-4"
      >
        <div className="mb-2 font-poppins">
          <input
            {...register("matric", { required: true })}
            type="text"
            required
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] p-2"
          />
          <label htmlFor="matric" className="text-sm text-gray-500">
            Matric ID
          </label>
        </div>
        <div className="mb-2 font-poppins">
          <select
            {...register("faculty", { required: true })}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] p-2"
          >
            <option value="">-- Choose Faculty --</option>
            {faculties?.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
          <label htmlFor="faculty" className="text-sm text-gray-500">
            Faculty
          </label>
        </div>{" "}
        <div className="mb-2 font-poppins">
          <select
            {...register("department", { required: true })}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] p-2"
          >
            {loadingDepartments ? (
              <option>Loading...</option>
            ) : (
              departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))
            )}
          </select>
          <label htmlFor="department" className="text-sm text-gray-500">
            Department
          </label>
        </div>
        <div className="mb-2 font-poppins">
          <input
            {...register("year", { required: true })}
            type="text"
            required
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] p-2"
          />
          <label htmlFor="year" className="text-sm text-gray-500">
            Year
          </label>
        </div>{" "}
        <div className="mb-2 font-poppins">
          <input
            {...register("tel", { required: true })}
            type="tel"
            required
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] p-2"
          />
          <label htmlFor="tel" className="text-sm text-gray-500">
            Phone Number
          </label>
        </div>
        <button
          type="submit"
          className="p-3 btn btn-black cursor-pointer h-fit hover:bg-gray-900 bg-gray-950 text-sm font-open-sans uppercase rounded-3xl text-white font-semibold"
        >
          Continue to Dashboard
        </button>
      </form>
    </div>
  )
}
export default Onboarding
