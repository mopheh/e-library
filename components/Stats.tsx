import React from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import Stat from "@/components/Stat";
import Welcome from "@/components/Welcome";

const Stats = () => {
  const { user } = useUser();
  return (
    <div className="flex gap-8 my-10">
      <Welcome
        name={user?.firstName}
        guide={" Monitor all books and material in your library"}
      />
      <Stat title={"Available Resources"} stat={24} />
      <Stat title={"CBT Test taken"} stat={10} />
    </div>
  );
};
export default Stats;
