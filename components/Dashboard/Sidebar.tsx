"use client"

import React, { useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { BookmarkIcon } from "@heroicons/react/24/solid"
import {
  BookOpenIcon,
  ClipboardIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
  MenuIcon,
  XIcon,
} from "lucide-react"

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboardIcon,
    id: "dashboard",
  },
  { name: "Library", path: "/library", icon: BookOpenIcon, id: "library" },
  { name: "Saved Books", path: "/saved", icon: BookmarkIcon, id: "saved" },
  { name: "CBT Test", path: "/cbt", icon: ClipboardIcon, id: "cbt" },
  { name: "Profile", path: "/profile", icon: UserIcon, id: "profile" },
  { name: "Settings", path: "/settings", icon: SettingsIcon, id: "settings" },
]

interface SidebarProps {
  role?: string
  isOpen?: boolean
  toggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const { role } = useParams()
  const router = useRouter()
  const [active, setActive] = useState("dashboard")

  const handleNavigation = (id: string, route: string) => {
    setActive(id)
    router.push(`/${role}/${route}`)
    toggle() // Close drawer on mobile
  }

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => toggle()}
          className="p-2 bg-white rounded-full shadow-md"
        >
          {isOpen ? (
            <XIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[#f9f9fb] p-4 z-40 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 md:static`}
      >
        <div className="flex flex-col gap-5 h-full relative">
          {/* Logo */}
          <div className="w-full">
            <Image
              src="/univault.png"
              alt="Univault Logo"
              className="mx-auto"
              width={150}
              height={50}
              priority
            />
          </div>

          <hr className="border-t border-gray-300 opacity-30 my-2" />

          {/* Menu */}
          <nav className="flex flex-col gap-2">
            {menuItems.map(({ name, icon: Icon, id, path }) => {
              const isActive = active === id
              return (
                <div
                  key={id}
                  onClick={() => handleNavigation(id, path)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-white shadow-[2px_2px_4px_#f1f5f9,_-2px_-2px_4px_#ffffff]"
                      : "rounded-full"
                  }`}
                >
                  <div
                    className={`h-9 w-9 flex items-center justify-center rounded-full p-2 ${
                      isActive
                        ? "bg-[#3b82f6] text-white"
                        : "bg-white text-[#3b82f6] shadow-[4px_4px_8px_#e2e8f0,_-4px_-4px_8px_#ffffff]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`font-poppins text-sm ${
                      isActive ? "text-gray-700 font-medium" : "text-gray-500"
                    }`}
                  >
                    {name}
                  </span>
                </div>
              )
            })}
          </nav>

          {/* Admin Link */}
          {role === "admin" && (
            <div
              onClick={() => router.push("/admin/data")}
              className="flex gap-3 font-poppins text-xs items-center relative bottom-0 h-auto  cursor-pointer"
            >
              <div className="h-9 w-9 flex items-center justify-center rounded-full p-2 bg-white text-[#1E3A8A]">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3>Manage Data</h3>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay when open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={() => toggle()}
        />
      )}
    </>
  )
}

export default Sidebar
