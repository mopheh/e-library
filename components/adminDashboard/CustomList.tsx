"use client";
import React, { useState } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import AddCoursesForm from "@/components/AddCourses";
import FormModal from "@/components/FormDialogBody";
import { UploadBookForm } from "@/components/adminDashboard/AddBook";

const CustomList = ({
  children,
  name,
  courses,
  department,
  students,
}: {
  children: React.ReactNode;
  name: string;
  courses: Course[] | undefined;
  department: Department[] | null;
  students?: Credentials[];
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg w-full md:w-1/2 p-3 md:py-5 h-fit px-6 md:px-8">
      {open && (
        <div className="fixed inset-0 backdrop-blur-xs w-screen h-screen"></div>
      )}
      <div className="flex justify-between items-center mb-10">
        <h3 className="font-semibold  font-open-sans">{name}</h3>
        <button
          className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-full  px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 bg-zinc-50"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="w-6 h-6" /> Add New
        </button>
      </div>
      {children}
      <FormModal open={open} setOpen={setOpen}>
        {name === "Books" && (
          <UploadBookForm department={department} setOpen={setOpen} />
        )}
      </FormModal>
    </div>
  );
};
export default CustomList;
