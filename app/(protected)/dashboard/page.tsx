"use client"
import React from "react"
import { useUser } from "@clerk/nextjs"
import HomeDashboard from "@/components/Dashboard/HomeDashboard"
import AspirantDashboard from "@/components/Dashboard/AspirantDashboard"
import MobileDashboard from "@/components/Dashboard/MobileDashboard"
import { useUserData } from "@/hooks/useUsers"
import { LogoLoader } from "@/components/LogoLoader"

const Page = () => {
  const { isLoaded } = useUser()
  const { data: dbUser, isLoading: dbUserLoading } = useUserData()

  if (!isLoaded || dbUserLoading) {
    return <LogoLoader />
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
