"use client";
import React from "react";
import Sidebar from "@/components/Sidebar";
import AdminDashboard from "@/components/AdminDashboard";

const Page = ({ params }: { params: { role: string } }) => {
  // @ts-ignore
  const { role } = React.use(params);
  return (
    <div className="bg-gray-50 flex">
      <Sidebar role={role} />
      <AdminDashboard />
    </div>
  );
};
export default Page;
