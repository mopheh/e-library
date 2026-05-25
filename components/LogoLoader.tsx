import React from "react";
import Image from "next/image";

export const LogoLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex items-center justify-center animate-fade-in">
      <div className="relative flex justify-center items-center w-24 h-24">
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        
        {/* Center Logo */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <Image
            src="/rcf-logo.png"
            alt="Loading RCF..."
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
};
