"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/auth";
import { useFaculties } from "@/hooks/useFaculties";
import { toast } from "sonner";
import { useDepartments } from "@/hooks/useDepartments";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 🔹 Validation schema
const onboardingSchema = z.object({
  matric: z
    .string()
    .min(3, "Matric ID must be at least 3 characters")
    .max(20, "Matric ID too long"),
  faculty: z.string().min(1, "Faculty is required"),
  department: z.string().min(1, "Department is required"),
  level: z.enum(["100", "200", "300", "400", "500", "600"], {
    errorMap: () => ({
      message: "Level must be 100, 200, 300, 400, 500, or 600",
    }),
  }),
  tel: z.string().regex(/^\+?\d{7,15}$/, "Enter a valid phone number"),
  gender: z.enum(["MALE", "FEMALE"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type FormData = z.infer<typeof onboardingSchema>;

const Onboarding = () => {
  const { data: faculties, isError, error } = useFaculties(1, 1000);

  useEffect(() => {
    if (isError) {
      console.log(error.message);
      toast.error("Something went wrong", {
        description: error?.message || "Unable to fetch faculties",
        style: {
          color: "#ef4444",
          fontFamily: "Josefin Sans",
          fontWeight: "bold",
        },
      });
    }
  }, [isError, error]);

  const { user } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(onboardingSchema),
  });

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
      level: data?.level,
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
      error: (err) => {
        console.error("DB Error:", err);

        const description =
          err?.response?.data?.message ||
          err?.cause?.message ||
          err?.meta?.cause ||
          err?.message ||
          "Something went wrong";

        return {
          message: "Error creating User",
          description,
          style: {
            color: "#ef4444",
            fontFamily: "Josefin Sans",
            fontWeight: "bold",
          },
        };
      },
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
        <div className="mb-2 font-poppins">
          <input
            {...register("matric")}
            type="text"
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          {errors.matric && (
            <p className="text-red-500 text-xs">{errors.matric.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Matric ID
          </label>
        </div>

        <div className="mb-2 font-poppins">
          <select
            {...register("faculty")}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          >
            <option value="">-- Choose Faculty --</option>
            {faculties?.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
          {errors.faculty && (
            <p className="text-red-500 text-xs">{errors.faculty.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Faculty
          </label>
        </div>

        <div className="mb-2 font-poppins">
          <select
            {...register("department")}
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
          {errors.department && (
            <p className="text-red-500 text-xs">{errors.department.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Department
          </label>
        </div>

        <div className="mb-2 font-poppins">
          <input
            {...register("level")}
            type="text"
            placeholder="100, 200, 300..."
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          {errors.level && (
            <p className="text-red-500 text-xs">{errors.level.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Level
          </label>
        </div>

        <div className="mb-2 font-poppins">
          <input
            {...register("tel")}
            type="tel"
            placeholder="+2348012345678"
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          {errors.tel && (
            <p className="text-red-500 text-xs">{errors.tel.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Phone Number
          </label>
        </div>

        <div className="mb-2 font-poppins">
          <select
            {...register("gender")}
            className="border-0 focus:outline focus:outline-sky-500 font-rubik text-sm rounded-xl w-full bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          >
            <option value="">-- Select Gender --</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-xs">{errors.gender.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Gender
          </label>
        </div>

        <div className="mb-2 font-poppins col-span-1 sm:col-span-2 lg:col-span-3">
          <textarea
            {...register("address")}
            rows={3}
            className="border-0 focus:outline font-rubik text-sm focus:outline-sky-500 rounded-xl w-full resize-none bg-[#f7f7f9] dark:bg-gray-700 text-gray-900 dark:text-white p-2"
          />
          {errors.address && (
            <p className="text-red-500 text-xs">{errors.address.message}</p>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Address
          </label>
        </div>

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
