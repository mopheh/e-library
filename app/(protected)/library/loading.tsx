import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );
}
