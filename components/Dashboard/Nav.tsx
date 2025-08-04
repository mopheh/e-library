"use client"
import React from "react"
import Breadcrumbs from "@/components/Breadcrumbs"
import { SearchIcon } from "lucide-react"
import { BellIcon } from "@heroicons/react/20/solid"
import Image from "next/image"
import { useAuth, useUser } from "@clerk/nextjs"
import { STORAGE_KEY } from "@/lib/utils"

const Nav = () => {
  const { user } = useUser()
  const { signOut } = useAuth()
  return (
    <div className="flex w-full justify-between items-start mb-5">
      <Breadcrumbs />
      <div className="flex gap-2 items-center font-poppins">
        {/* <div className="border-1 w-56 flex items-center bg-white border-gray-200 px-2 rounded-2xl">
          <SearchIcon className="w-5 h-5 text-gray-500 mr-2" />
          <input
            placeholder="Type here..."
            className="font-poppins focus:outline-none  w-full p-2 placeholder:text-xs placeholder:font-poppins placeholder:text-gray-400"
            type="text"
          />
        </div> */}
        <div className="text-gray-500 flex items-center gap-2">
          {/* <BellIcon className="w-5 h-5" /> */}
          <div className="flex gap-2 items-center">
            {user && (
              <>
                <Image
                  src={user?.imageUrl}
                  alt={"user image"}
                  height={45}
                  width={45}
                  title="My profile"
                  className="rounded-full border-1 border-white cursor-pointer "
                />
                <div className="text-xs">
                  <h3 className="text-gray-800 font-medium">
                    {user?.fullName}
                  </h3>
                  <p className="text-gray-500">
                    {user?.emailAddresses[0].emailAddress}
                  </p>
                </div>
                <Image
                  src={"/icons/logout.svg"}
                  alt={"logout"}
                  width={22}
                  height={22}
                  className="cursor-pointer"
                  onClick={() => {
                    signOut()
                    localStorage.setItem(STORAGE_KEY, "[]")
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Nav
