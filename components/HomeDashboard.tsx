import React, { useEffect } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SearchIcon } from "lucide-react";
import { UserIcon } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/20/solid";
import { useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Stats from "@/components/Stats";
import BookWrap from "@/components/BookWrap";
import AddedMaterials from "@/components/AddedMaterials";

const HomeDashboard = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) {
      console.log(user);
    }
  }, [isSignedIn]);
  return (
    <div className="p-4 py-6 w-screen">
      <Nav />
      <Stats />
      <BookWrap />
      <AddedMaterials />
    </div>
  );
};
export default HomeDashboard;
