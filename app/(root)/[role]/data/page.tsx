"use client"
import React from "react"
import Sidebar from "@/components/Dashboard/Sidebar"
import AdminDashboard from "@/components/adminDashboard/AdminDashboard"

const Page = ({ params }: { params: { role: string } }) => {
  // @ts-ignore
  return <AdminDashboard />
}
export default Page
