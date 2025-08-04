"use client"
import React, { useEffect } from "react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import HomeDashboard from "@/components/Dashboard/HomeDashboard"

const Page = ({ params }: { params: { role: string } }) => {
  const { signOut } = useClerk()
  // @ts-ignore
  const { role } = React.use(params)
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  useEffect(() => {
    isLoaded
      ? isSignedIn
        ? console.log(user)
        : router.push("/sign-in")
      : "Loading..."
  }, [isLoaded, isSignedIn])
  return <HomeDashboard />
}
export default Page
