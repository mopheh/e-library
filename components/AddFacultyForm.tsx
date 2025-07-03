import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createFaculty } from "@/actions/faculty";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { createDepartment } from "@/actions/department";
import { useFaculties } from "@/hooks/useFaculties";
type FormData = {
  faculty: string;
  department: string;
};
const AddFacultyForm = ({ type }: { type: string }) => {
  const { data: faculties, isError, error, refetch } = useFaculties();
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
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>();
  const selectedFaculty = watch("faculty");
  const onSubmit = async (data: FormData) => {
    const promise =
      type === "faculty"
        ? createFaculty(data)
        : createDepartment({ name: data.department, faculty: data.faculty });
    toast.promise(promise, {
      loading:
        type === "department"
          ? "Creating departments..."
          : "Creating faculty...",
      success: {
        message: `${type[0].toUpperCase() + type.slice(1)} created Successfully`,
        description: type === "faculty" && "You can now assign departments",
        style: {
          color: "#22c55e",
          fontWeight: "bold",
        },
      },
      error: (err) => ({
        message: "Error creating faculty",
        description: err.message || "Something went wrong",
        style: {
          color: "#ef4444",
          fontFamily: "Josefin Sans",
          fontWeight: "bold",
        },
      }),
    });
    try {
      console.log("Creating!!!");
      await promise;
      // queryClient.invalidateQueries({ queryKey: [faculties] });
      refetch();
      reset();
    } catch (err: any) {
      console.log(err);
    }
  };
  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {type === "faculty" && (
        <div>
          <label className="text-xs font-medium font-poppins">
            Name of Faculty
          </label>
          <input
            {...register("faculty", { required: true })}
            type="text"
            className="w-full border px-3 py-2 rounded-lg text-sm mt-1 placeholder:font-josefin-sans placeholder:text-sm"
            placeholder="e.g Basic Medical Science (BMS)"
          />
        </div>
      )}
      {type === "department" && (
        <>
          <div>
            <label className="text-sm font-medium font-poppins">
              Select Faculty
            </label>
            <select
              {...register("faculty", { required: true })}
              className="w-full border px-3 py-2 rounded-lg text-sm mt-1"
            >
              <option value="">-- Choose Faculty --</option>
              {faculties?.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium font-poppins">
              Department
            </label>
            <input
              {...register("department", { required: true })}
              type="text"
              disabled={!selectedFaculty}
              className={`w-full border px-3 py-2 rounded-lg text-sm mt-1 placeholder:font-josefin-sans placeholder:text-sm ${!selectedFaculty && "opacity-50 cursor-not-allowed"}`}
              placeholder="e.g Anatomy"
            />
          </div>
        </>
      )}
      <button
        type="submit"
        className="bg-green-600 w-full py-2 text-white rounded-lg hover:bg-green-700 text-xs font-poppins cursor-pointer"
      >
        Submit
      </button>
    </form>
  );
};
export default AddFacultyForm;
