"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import Welcome from "@/components/Welcome";
import Stat from "@/components/Stat";
import { PlusIcon } from "@heroicons/react/20/solid";
import FormModal from "@/components/FormDialogBody";
import AddFacultyForm from "@/components/AddFacultyForm";
import { useFaculties } from "@/hooks/useFaculties";
import { useUsers } from "@/hooks/useUsers";
import FacultyRow from "@/components/FacultyRow";

const AdminDashboard = () => {
  const { data: faculties } = useFaculties();

  const { user, isSignedIn, isLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  useEffect(() => {
    if (user) {
      console.log(user);
    }
  }, [isSignedIn]);
  return (
    <div className="p-4 py-6 w-screen">
      {open && (
        <div className="fixed inset-0 backdrop-blur-xs w-screen h-screen"></div>
      )}
      <Nav />
      <div className="flex gap-8 my-10">
        <Welcome
          name={"Admin"}
          guide={" Manage all users, books and material in uniVault"}
        />
        <Stat title={"Users"} stat={24} />
        <Stat title={"Total Material"} stat={10} />
        <Stat title={"CBT Usage"} stat={19} />
        <Stat title={"Total Revenue"} stat={0} />
      </div>
      <div className="px-2 flex gap-4">
        <div className="bg-white rounded-lg p-5 w-[50%] mt-5 px-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-open-sans font-semibold ">Faculty</h3>
            <button
              className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-lg px-3 py-2 text-xs border border-gray-200 bg-gray-50"
              onClick={() => {
                setType("faculty");
                setOpen(true);
              }}
            >
              <PlusIcon className="w-6 h-6" /> Add Faculty
            </button>
          </div>
          <table className="table-auto w-full border-collapse">
            <thead className="text-left">
              <tr className="tracking-wider !text-left uppercase text-gray-400 text-xs font-karla border-b border-gray-200">
                <th className="!text-left py-3">Name</th>
                <th className="!text-left">Number of Members</th>
              </tr>
            </thead>
            <tbody>
              {faculties &&
                faculties?.map((faculty) => (
                  <FacultyRow
                    key={faculty.id}
                    facultyId={faculty.id}
                    name={faculty.name}
                  />
                ))}
            </tbody>
          </table>
        </div>{" "}
        <div className="bg-white rounded-lg p-5 w-[50%] mt-5 px-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-open-sans font-semibold ">Department</h3>
            <button
              className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-lg px-3 py-2 text-xs border border-gray-200 bg-gray-50"
              onClick={() => {
                setType("department");
                setOpen(true);
              }}
            >
              <PlusIcon className="w-6 h-6" /> Add Department
            </button>
          </div>
          <table className="table-auto w-full border-collapse">
            <thead className="text-left">
              <tr className="tracking-wider !text-left uppercase text-gray-400 text-xs font-karla border-b border-gray-200">
                <th className="!text-left py-3">Name</th>
                <th className="!text-left">Number of Members</th>
                <th className="!text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-poppins text-xs py-3 text-gray-800 font-normal border-b border-gray-200">
                <td className="px-6 py-4">Electrical Engineering</td>
                <td>8</td>
                <td className="cursor-pointer text-xs font-medium  text-green-600 rounded-lg text-center">
                  View Details
                </td>
              </tr>
            </tbody>
          </table>

          <FormModal open={open} setOpen={setOpen}>
            <AddFacultyForm type={type} />
          </FormModal>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
