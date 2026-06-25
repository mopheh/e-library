"use client";

import { useEffect, useState } from "react";
import FacultyExplorer from "@/components/aspirant/FacultyExplorer";
import { Loader2 } from "lucide-react";

export default function Page() {
  const [intendedDepartmentId, setIntendedDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/aspirant/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setIntendedDepartmentId(data.stats.intendedDepartmentId ?? null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <FacultyExplorer initialDepartmentId={intendedDepartmentId} />;
}

