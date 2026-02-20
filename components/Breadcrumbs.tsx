
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const Breadcrumbs = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div>
      <div className="flex gap-2 font-poppins text-xs font-medium items-center">
        <span className="text-zinc-400">Pages</span>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const title = segment.replace(/-/g, " ");

          return (
            <React.Fragment key={href}>
              <span className="text-zinc-400">/</span>
              {isLast ? (
                <span className="text-zinc-900 dark:text-zinc-100 capitalize">{title}</span>
              ) : (
                <Link
                  href={href}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors capitalize"
                >
                  {title}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div>
        <h6 className="font-cabin font-bold text-lg capitalize">
          {segments.length > 0 ? segments[segments.length - 1].replace(/-/g, " ") : "Dashboard"}
        </h6>
      </div>
    </div>
  );
};
export default Breadcrumbs;
