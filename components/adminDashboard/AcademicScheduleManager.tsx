"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Calendar, GraduationCap, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import CalendarTab from "./schedule/CalendarTab";
import ExamScheduleTab from "./schedule/ExamScheduleTab";
import TimetableTab from "./schedule/TimetableTab";

const TABS = [
  { id: "calendar", label: "School Calendar", icon: Calendar },
  { id: "exams", label: "Exam Timetable", icon: GraduationCap },
  { id: "class", label: "Class Timetable", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AcademicScheduleManager() {
  const [tab, setTab] = useState<TabId>("calendar");
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [calRes, examRes, ttRes, facRes, deptRes] = await Promise.all([
        fetch("/api/admin/calendar"),
        fetch("/api/admin/exam-schedules"),
        fetch("/api/admin/timetables"),
        fetch("/api/faculty?skip=0&limit=100"),
        fetch("/api/departments?skip=0&limit=200"),
      ]);
      const [calData, examData, ttData, facData, deptData] = await Promise.all([
        calRes.json(), examRes.json(), ttRes.json(), facRes.json(), deptRes.json(),
      ]);
      setCalendarEvents(calData.events || []);
      setExamSchedules(examData.schedules || []);
      setTimetables(ttData.timetables || []);
      setFaculties(Array.isArray(facData) ? facData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch {
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-zinc-50 dark:border-zinc-900">
          <div className="flex gap-2 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black font-cabin text-[10px] uppercase tracking-widest transition-all ${
                  tab === t.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-black font-cabin text-[10px] uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="px-8 py-8">
          {tab === "calendar" && (
            <CalendarTab events={calendarEvents} loading={loading} onRefresh={fetchAll} />
          )}
          {tab === "exams" && (
            <ExamScheduleTab
              schedules={examSchedules}
              calendarEvents={calendarEvents}
              faculties={faculties}
              loading={loading}
              onRefresh={fetchAll}
            />
          )}
          {tab === "class" && (
            <TimetableTab
              timetables={timetables}
              faculties={faculties}
              departments={departments}
              loading={loading}
              onRefresh={fetchAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
