"use client";
import React from "react";
import { useParams } from "next/navigation";
import CbtContainer from "@/components/Dashboard/cbt/CbtContainer";
import AspirantCbt from "@/components/aspirant/AspirantCbt";

export default function Page() {
  const params = useParams();
  
  if (params?.role === "aspirant") {
    return <AspirantCbt />;
  }
  
  return <CbtContainer />;
}
