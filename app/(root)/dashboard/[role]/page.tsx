"use client";
import React, { useEffect } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import HomeDashboard from "@/components/HomeDashboard";

const Page = ({ params }: { params: { role: string } }) => {
  const { signOut } = useClerk();
  // @ts-ignore
  const { role } = React.use(params);
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  useEffect(() => {
    isLoaded
      ? isSignedIn
        ? console.log(user)
        : router.push("/sign-in")
      : "Loading...";
  }, [isLoaded, isSignedIn]);
  return (
    <div className="bg-gray-50 flex">
      {/*<button onClick={() => signOut()}>Logout</button> */}
      <Sidebar role={role} />
      <HomeDashboard />
    </div>
  );
};
export default Page;
