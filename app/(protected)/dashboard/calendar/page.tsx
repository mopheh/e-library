"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  BookOpen,
  GraduationCap,
  Coffee,
  Star,
  Trash2,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ────────────────────────────────────────────────── */
interface AcademicEvent {
  id: string;
  activity: string;
  startDate: string;
  endDate?: string | null;
  category: string;
  semester?: string | null;
  session: string;
}

interface PersonalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  color: string;
  type: "study" | "exam" | "break" | "reminder" | "other";
  done: boolean;
}

/* ─── Category colors ──────────────────────────────────────── */
const categoryStyle: Record<string, { bg: string; text: string; dot: string }> = {
  exam: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  lecture: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  registration: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
  break: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  orientation: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  matriculation: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  revision: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  result: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400", dot: "bg-pink-500" },
  other: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
};

const personalTypeColors: Record<string, string> = {
  study: "#6366f1",
  exam: "#ef4444",
  break: "#10b981",
  reminder: "#f59e0b",
  other: "#8b5cf6",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PERSONAL_KEY = "rcf_personal_events";

/* ─── Helpers ──────────────────────────────────────────────── */
function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function datesInRange(start: string, end?: string | null) {
  const dates: string[] = [];
  const s = new Date(start + "T00:00:00");
  const e = end ? new Date(end + "T00:00:00") : s;
  const cur = new Date(s);
  while (cur <= e) { dates.push(toYMD(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}

/* ─── Mini add-event modal ─────────────────────────────────── */
function AddEventModal({ date, onClose, onAdd }: {
  date: string;
  onClose: () => void;
  onAdd: (e: PersonalEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<PersonalEvent["type"]>("study");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      date,
      time: time || undefined,
      color: personalTypeColors[type],
      type,
      done: false,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 16 }}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black font-cabin text-lg text-zinc-900 dark:text-zinc-50">Add Event</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-poppins -mt-2">{date}</p>

        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Event title…"
          className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-poppins text-zinc-900 dark:text-zinc-50"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as PersonalEvent["type"])}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-poppins text-zinc-900 dark:text-zinc-100 outline-none"
            >
              <option value="study">📚 Study</option>
              <option value="exam">📝 Exam</option>
              <option value="break">☕ Break</option>
              <option value="reminder">🔔 Reminder</option>
              <option value="other">⭐ Other</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Time (opt.)</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-poppins text-zinc-900 dark:text-zinc-100 outline-none"
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!title.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black font-cabin text-sm rounded-2xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          Save Event
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string>(toYMD(today));
  const [academicEvents, setAcademic] = useState<AcademicEvent[]>([]);
  const [personal, setPersonal] = useState<PersonalEvent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Load academic calendar */
  useEffect(() => {
    fetch("/api/admin/calendar")
      .then(r => r.json())
      .then(d => setAcademic(d.events || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  /* Load / persist personal events */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSONAL_KEY);
      if (raw) setPersonal(JSON.parse(raw));
    } catch { }
  }, []);

  const savePersonal = (list: PersonalEvent[]) => {
    setPersonal(list);
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(list));
  };

  /* Calendar grid */
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInM = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInM) / 7) * 7;

  /* Build event map: date → events */
  const academicMap: Record<string, AcademicEvent[]> = {};
  academicEvents.forEach(ev => {
    datesInRange(ev.startDate, ev.endDate).forEach(d => {
      if (!academicMap[d]) academicMap[d] = [];
      academicMap[d].push(ev);
    });
  });

  const personalMap: Record<string, PersonalEvent[]> = {};
  personal.forEach(ev => {
    if (!personalMap[ev.date]) personalMap[ev.date] = [];
    personalMap[ev.date].push(ev);
  });

  /* Selected day events */
  const selAcademic = academicMap[selectedDay] || [];
  const selPersonal = personalMap[selectedDay] || [];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const toggleDone = (id: string) =>
    savePersonal(personal.map(e => e.id === id ? { ...e, done: !e.done } : e));

  const deleteEvent = (id: string) =>
    savePersonal(personal.filter(e => e.id !== id));

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-zinc-50/50 dark:bg-zinc-950 font-poppins">

      {/* ── Left: Calendar grid ─────────────────────────────── */}
      <div className="flex-1 p-5 md:p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">
              Study Planner
            </p>
            <h1 className="text-2xl md:text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
              {MONTHS[month]} {year}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(toYMD(today)); }}
              className="px-4 py-2 text-[11px] font-black font-cabin uppercase tracking-widest text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Today
            </button>
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <ChevronLeft className="w-4 h-4 text-zinc-500" />
            </button>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Exam", dot: "bg-red-500" },
            { label: "Lecture", dot: "bg-blue-500" },
            { label: "Break", dot: "bg-emerald-500" },
            { label: "Registration", dot: "bg-violet-500" },
            { label: "My Events", dot: "bg-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-700" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 font-cabin uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${l.dot}`} />
              {l.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - firstDay + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInM;
              const dateStr = isValid ? `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` : "";
              const isToday = dateStr === toYMD(today);
              const isSelected = dateStr === selectedDay;
              const acEvents = isValid ? (academicMap[dateStr] || []) : [];
              const pEvents = isValid ? (personalMap[dateStr] || []) : [];
              const hasEvents = acEvents.length > 0 || pEvents.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => isValid && setSelectedDay(dateStr)}
                  className={cn(
                    "min-h-[72px] p-2 border-b border-r border-zinc-100 dark:border-zinc-800/60 transition-colors",
                    isValid ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40" : "bg-zinc-50/50 dark:bg-zinc-900/50",
                    isSelected && "bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  )}
                >
                  {isValid && (
                    <>
                      <span className={cn(
                        "inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold font-cabin mb-1",
                        isToday ? "bg-indigo-600 text-white" : isSelected ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"
                      )}>
                        {dayNum}
                      </span>

                      {/* Dots */}
                      <div className="flex flex-wrap gap-0.5">
                        {acEvents.slice(0, 2).map((e, i) => {
                          const s = categoryStyle[e.category] || categoryStyle.other;
                          return <span key={i} className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />;
                        })}
                        {pEvents.slice(0, 2).map((e, i) => (
                          <span key={`p${i}`} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        ))}
                        {(acEvents.length + pEvents.length > 4) && (
                          <span className="text-[8px] text-zinc-400 font-bold leading-none mt-0.5">+{acEvents.length + pEvents.length - 4}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Day detail panel ──────────────────────────── */}
      <div className="w-full lg:w-80 xl:w-96 p-5 lg:pr-8 lg:pt-8 flex flex-col gap-4">

        {/* Add event button */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black font-cabin text-sm rounded-2xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Personal Event
        </button>

        {/* Selected date header */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">
            {selAcademic.length + selPersonal.length} event{selAcademic.length + selPersonal.length !== 1 ? "s" : ""}
          </p>
          <h2 className="text-lg font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">
            {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
        </div>

        {/* Event list */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          {/* Academic events */}
          {selAcademic.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3" /> Academic Calendar
              </p>
              <div className="space-y-2">
                {selAcademic.map(ev => {
                  const s = categoryStyle[ev.category] || categoryStyle.other;
                  return (
                    <div key={ev.id} className={`p-3.5 rounded-2xl border ${s.bg}`}>
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                        <div>
                          <p className={`text-xs font-bold ${s.text}`}>{ev.activity}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{ev.category} · {ev.session}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal events */}
          {selPersonal.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2 flex items-center gap-1.5">
                <Star className="w-3 h-3" /> My Events
              </p>
              <div className="space-y-2">
                {selPersonal.map(ev => (
                  <motion.div
                    key={ev.id}
                    layout
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-start gap-3"
                  >
                    <button
                      onClick={() => toggleDone(ev.id)}
                      className={cn("shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 transition-colors",
                        ev.done ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-600"
                      )}
                    >
                      {ev.done && <CheckCircle2 className="w-4 h-4 text-white -m-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold text-zinc-900 dark:text-zinc-100", ev.done && "line-through opacity-50")}>
                        {ev.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ev.time && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <Clock className="w-2.5 h-2.5" />{ev.time}
                          </span>
                        )}
                        <span className="text-[10px] capitalize" style={{ color: ev.color }}>
                          {ev.type}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="shrink-0 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {selAcademic.length === 0 && selPersonal.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 text-2xl">
                📅
              </div>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 font-cabin">No events</p>
              <p className="text-xs text-zinc-400 mt-1">Add a personal study session or check another date.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add event modal */}
      <AnimatePresence>
        {showAdd && (
          <AddEventModal
            date={selectedDay}
            onClose={() => setShowAdd(false)}
            onAdd={ev => savePersonal([...personal, ev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
