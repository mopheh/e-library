"use client"
import React, { useEffect } from "react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter, useParams } from "next/navigation"
import HomeDashboard from "@/components/Dashboard/HomeDashboard"
import AspirantDashboard from "@/components/Dashboard/AspirantDashboard"

const Page = () => {
  const { signOut } = useClerk()
  // @ts-ignore
  const router = useRouter()
  const params = useParams()
  const { isSignedIn, isLoaded, user } = useUser()
  useEffect(() => {
    isLoaded
      ? isSignedIn
        ? console.log(user)
        : router.push("/sign-in")
      : "Loading..."
  }, [isLoaded, isSignedIn])

  if (params?.role === "aspirant") {
    return <AspirantDashboard />
  }

  return <HomeDashboard />
}
export default Page
