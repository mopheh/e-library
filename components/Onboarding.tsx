"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/auth";
import { useFaculties } from "@/hooks/useFaculties";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";

type FormData = {
  matric: string;
  faculty: string;
  department: string;
  year: string;
  tel: string;
  gender: string;
  address: string;
};

const Onboarding = () => {
  const { data: faculties, isError, error } = useFaculties(1, 1000);
  useEffect(() => {
    if (isError) {
      toast.error("Something went wrong", {
        description: error?.message || "Unable to fetch faculties",
        style: {
          color: "#ef4444",
          fontFamily: "Josefin Sans",
          fontWeight: "bold",
        },
      });
    }
  }, [isError]);

  const { user } = useUser();
  const router = useRouter();

  const { register, handleSubmit, watch } = useForm<FormData>();

  const selectedFaculty = watch("faculty");
  const { data: departments, isLoading: loadingDepartments } = useDepartments({
    facultyId: selectedFaculty,
  });

  const onSubmit = async (data: FormData) => {
    console.log(data);

    const promise = createUser({
      //@ts-ignore
      clerkId: user?.id,
      email: user?.emailAddresses[0].emailAddress,
      fullName: `${user?.firstName} ${user?.lastName}`,
      facultyId: data?.faculty,
      departmentId: data?.department,
      year: data?.year,
      matricNo: data?.matric,
      gender: data?.gender,
      address: data?.address,
      onboarded: true,
    });

    toast.promise(promise, {
      loading: "Creating User..",
      success: {
        message: `User created Successfully`,
        description: "Signing in to dashboard, Please wait.",
        style: { color: "#22c55e", fontWeight: "bold" },
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
    });

    await promise;

    await user?.update({
      unsafeMetadata: {
        ...data,
        role: "student",
        onboarded: true,
      },
    });

    router.push("/student/dashboard");
  };

  return (
    <div className="w-full max-w-4xl py-5 px-6 sm:px-8 bg-white dark:bg-gray-900 shadow-xl rounded-lg">
      <h1 className="text-xl font-bold mb-4 font-karla text-gray-900 dark:text-gray-100">
        Complete Your Profile
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Matric */}
        <div className="mb-2 font-poppins">
          <input
            {...register("matric", { required: true })}
            type="text"
            required
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Matric ID
          </label>
        </div>

        {/* Faculty */}
        <div className="mb-2 font-poppins">
          <select
            {...register("faculty", { required: true })}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          >
            <option value="">-- Choose Faculty --</option>
            {faculties?.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Faculty
          </label>
        </div>

        {/* Department */}
        <div className="mb-2 font-poppins">
          <select
            {...register("department", { required: true })}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          >
            {loadingDepartments ? (
              <option>Loading...</option>
            ) : (
              <>
                <option value="">-- Choose Department --</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Department
          </label>
        </div>

        {/* Year */}
        <div className="mb-2 font-poppins">
          <input
            {...register("year", { required: true })}
            type="text"
            required
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Year
          </label>
        </div>

        {/* Phone */}
        <div className="mb-2 font-poppins">
          <input
            {...register("tel", { required: true })}
            type="tel"
            required
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Phone Number
          </label>
        </div>

        {/* Gender */}
        <div className="mb-2 font-poppins">
          <select
            {...register("gender", { required: true })}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          >
            <option value="">-- Select Gender --</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Gender
          </label>
        </div>

        {/* Address */}
        <div className="mb-2 font-poppins col-span-1 sm:col-span-2 lg:col-span-3">
          <textarea
            {...register("address", { required: true })}
            rows={3}
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full resize-none bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Address
          </label>
        </div>

        {/* Button */}
        <button
          type="submit"
          className="p-3 btn btn-black cursor-pointer h-fit hover:bg-gray-900 dark:hover:bg-gray-700 bg-gray-950 dark:bg-gray-600 text-sm font-open-sans uppercase rounded-3xl text-white font-semibold"
        >
          Continue to Dashboard
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
