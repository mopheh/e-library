"use client"
import React, { useEffect } from "react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import HomeDashboard from "@/components/Dashboard/HomeDashboard"
import AspirantDashboard from "@/components/Dashboard/AspirantDashboard"
import AdminDashboard from "@/components/adminDashboard/AdminDashboard"
import { useUserData } from "@/hooks/useUsers"

const Page = () => {
  const { signOut } = useClerk()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const { data: dbUser, isLoading: dbUserLoading } = useUserData()

  if (!isLoaded || dbUserLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (dbUser?.role === "ASPIRANT") {
    return <AspirantDashboard />
  }

  // Fallback to HomeDashboard for ADMIN, STUDENT and any other roles (e.g. FACULTY REP)

  // Fallback to HomeDashboard for STUDENT and any other roles (e.g. FACULTY REP)
  return <HomeDashboard />
}
export default Page
