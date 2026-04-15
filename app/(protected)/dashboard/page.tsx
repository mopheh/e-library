"use client"
import React from "react"
import { useUser } from "@clerk/nextjs"
import HomeDashboard from "@/components/Dashboard/HomeDashboard"
import AspirantDashboard from "@/components/Dashboard/AspirantDashboard"
import MobileDashboard from "@/components/Dashboard/MobileDashboard"
import { useUserData } from "@/hooks/useUsers"

const Page = () => {
  const { isLoaded } = useUser()
  const { data: dbUser, isLoading: dbUserLoading } = useUserData()

  if (!isLoaded || dbUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center premium-bg">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="hidden sm:block">
        {dbUser?.role === "ASPIRANT" ? <AspirantDashboard /> : <HomeDashboard />}
      </div>
      <div className="sm:hidden">
        <MobileDashboard />
      </div>
    </>
  )
}
export default Page
