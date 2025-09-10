import React from "react";

const Breadcrumbs = () => {
  return (
    <div>
      <div className="flex gap-2 font-poppins text-xs font-medium">
        <span className="text-zinc-400">Pages</span>
        <span>/</span>
        <span>Home</span>
      </div>
      <div>
        <h6 className="font-cabin">Dashboard</h6>
      </div>
    </div>
  );
};
export default Breadcrumbs;
