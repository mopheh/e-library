import React, { useState } from "react";
import { HomeIcon } from "@heroicons/react/24/outline";
import { BookIcon, FileIcon, SettingsIcon } from "lucide-react";
import { BookmarkIcon, ComputerDesktopIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  { name: "Home", icon: <HomeIcon className="icon" />, id: "home" },
  {
    name: "All Resources",
    icon: <FileIcon className="icon" />,
    id: "resources",
  },
  { name: "All Books", icon: <BookIcon className="icon" />, id: "books" },
  { name: "Saved Books", icon: <BookmarkIcon className="icon" />, id: "saved" },
  {
    name: "CBT Practice",
    icon: <ComputerDesktopIcon className="icon" />,
    id: "cbt",
  },
];

interface SidebarProps {
  role?: string;
}

const Sidebar = ({ role }: SidebarProps) => {
  const [active, setActive] = useState("home");

  return (
    <div className="h-lvh w-80 relative">
      <div className="flex flex-col gap-4 px-5 py-8 w-full ">
        <div className="w-full">
          <Image
            src={"/univault.png"}
            alt={"logo"}
            className="mx-auto"
            width={150}
            height={50}
          />
        </div>
        <hr className="border-t border-gray-300 opacity-30 my-2" />
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`flex items-center gap-3 py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 ${
              active === item.id
                ? "bg-white shadow-[2px_2px_4px_#f1f5f9,_-2px_-2px_4px_#ffffff]"
                : "rounded-full"
            }`}
          >
            <div
              className={`h-9 w-9 flex items-center justify-items-center rounded-full p-2 ${
                active === item.id
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-white text-[#1E3A8A] shadow-[4px_4px_8px_#e2e8f0,_-4px_-4px_8px_#ffffff]"
              } `}
            >
              {item.icon}
            </div>
            <span
              className={`font-poppins text-sm ${
                active === item.id
                  ? "text-gray-700 font-medium"
                  : "text-gray-500"
              }`}
            >
              {item.name}
            </span>
          </div>
        ))}
        {role === "admin" && (
          <Link
            href={`/dashboard/admin/data`}
            className="flex gap-3 font-poppins text-xs items-center absolute bottom-12 cursor-pointer"
          >
            <div
              className={`h-9 w-9 flex items-center justify-items-center rounded-full p-2 bg-white text-[#1E3A8A] `}
            >
              <SettingsIcon />
            </div>
            <h3>Manage Data</h3>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
