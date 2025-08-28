"use client";
import React from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SearchIcon } from "lucide-react";
import { BellIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useAuth, useUser } from "@clerk/nextjs";
import { STORAGE_KEY } from "@/lib/utils";

const Nav = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  return (
    <div className="hidden sm:flex w-full justify-between items-start sm:items-center mb-0 sm:mb-5 gap-2 sm:gap-4">
      <Breadcrumbs />
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center font-poppins">
        {/* <div className="border-1 w-56 flex items-center bg-white border-gray-200 px-2 rounded-2xl">
          <SearchIcon className="w-5 h-5 text-gray-500 mr-2" />
          <input
            placeholder="Type here..."
            className="font-poppins focus:outline-none  w-full p-2 placeholder:text-xs placeholder:font-poppins placeholder:text-gray-400"
            type="text"
          />
        </div> */}
        <div className="text-gray-500 hidden dark:text-gray-400 sm:flex items-center gap-3">
          {/* <BellIcon className="w-5 h-5" /> */}
          <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
            {user && (
              <>
                <Image
                  src={user?.imageUrl}
                  alt={"user image"}
                  height={35}
                  width={35}
                  title="My profile"
                  className="rounded-full border-1 border-white cursor-pointer"
                />
                <div className=" text-[10px] sm:text-xs">
                  <h3 className="text-gray-800 dark:text-gray-200 font-medium">
                    {user?.fullName}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {user?.emailAddresses[0].emailAddress}
                  </p>
                </div>
                <Image
                  src={"/icons/logout.svg"}
                  alt={"logout"}
                  width={20}
                  height={20}
                  className="cursor-pointer"
                  onClick={() => {
                    signOut();
                    localStorage.setItem(STORAGE_KEY, "[]");
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Nav;
