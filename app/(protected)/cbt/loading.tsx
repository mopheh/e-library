import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
}
