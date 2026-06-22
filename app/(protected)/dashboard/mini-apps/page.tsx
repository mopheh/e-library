"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Timer, Ruler, FileText, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────── */
type AppId = "gpa" | "pomodoro" | "units" | "wordcount" | null;


interface Course { id: string; name: string; units: number; grade: string }
const GRADE_POINTS: Record<string, number> = { "A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0 };

function GPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "", units: 3, grade: "A" },
    { id: "2", name: "", units: 3, grade: "B" },
  ]);
  const [semesterGPA, setSemesterGPA] = useState<number | null>(null);

  const addCourse = () => setCourses(c => [...c, { id: crypto.randomUUID(), name: "", units: 3, grade: "A" }]);
  const remove = (id: string) => setCourses(c => c.filter(x => x.id !== id));
  const update = (id: string, field: keyof Course, val: any) =>
    setCourses(c => c.map(x => x.id === id ? { ...x, [field]: val } : x));

  const calculate = () => {
    const totalUnits = courses.reduce((s, c) => s + c.units, 0);
    if (!totalUnits) return;
    const totalPoints = courses.reduce((s, c) => s + (GRADE_POINTS[c.grade] ?? 0) * c.units, 0);
    setSemesterGPA(parseFloat((totalPoints / totalUnits).toFixed(2)));
  };

  const gpaColor = semesterGPA === null ? "" : semesterGPA >= 4.5 ? "text-emerald-600" : semesterGPA >= 3.5 ? "text-blue-600" : semesterGPA >= 2.5 ? "text-amber-600" : "text-red-600";
  const gpaLabel = semesterGPA === null ? "" : semesterGPA >= 4.5 ? "First Class" : semesterGPA >= 3.5 ? "Second Class Upper" : semesterGPA >= 2.5 ? "Second Class Lower" : semesterGPA >= 1.5 ? "Third Class" : "Fail";

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {courses.map((c, i) => (
          <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
            <input value={c.name} onChange={e => update(c.id, "name", e.target.value)}
              placeholder={`Course ${i + 1}`}
              className="col-span-5 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <input type="number" min={1} max={6} value={c.units} onChange={e => update(c.id, "units", +e.target.value)}
              className="col-span-3 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <select value={c.grade} onChange={e => update(c.id, "grade", e.target.value)}
              className="col-span-3 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs outline-none">
              {Object.keys(GRADE_POINTS).map(g => <option key={g}>{g}</option>)}
            </select>
            <button onClick={() => remove(c.id)} className="col-span-1 flex justify-center text-zinc-300 hover:text-red-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={addCourse} className="py-2.5 text-xs font-bold font-cabin uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors">
          + Add Course
        </button>
        <button onClick={calculate} className="py-2.5 text-xs font-bold font-cabin uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-colors">
          Calculate GPA
        </button>
      </div>

      {semesterGPA !== null && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1">Your GPA</p>
          <p className={`text-4xl font-black font-cabin ${gpaColor}`}>{semesterGPA.toFixed(2)}</p>
          <p className={`text-sm font-bold mt-1 ${gpaColor}`}>{gpaLabel}</p>
          <p className="text-xs text-zinc-400 mt-1">Based on 5.0 scale (UNIBEN)</p>
        </motion.div>
      )}
    </div>
  );
}


type PomPhase = "focus" | "short" | "long";
const PHASES: Record<PomPhase, { label: string; duration: number; color: string }> = {
  focus: { label: "Focus", duration: 25 * 60, color: "text-indigo-600" },
  short: { label: "Short Break", duration: 5 * 60, color: "text-emerald-600" },
  long: { label: "Long Break", duration: 15 * 60, color: "text-blue-600" },
};

function PomodoroTimer() {
  const [phase, setPhase] = useState<PomPhase>("focus");
  const [remaining, setRemaining] = useState(PHASES.focus.duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(timerRef.current!);
            setRunning(false);
            if (phase === "focus") setSessions(s => s + 1);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, phase]);

  const switchPhase = (p: PomPhase) => {
    setRunning(false);
    setPhase(p);
    setRemaining(PHASES[p].duration);
  };

  const reset = () => { setRunning(false); setRemaining(PHASES[phase].duration); };
  const pct = ((PHASES[phase].duration - remaining) / PHASES[phase].duration) * 100;
  const circumference = 2 * Math.PI * 80;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Phase selector */}
      <div className="flex gap-2">
        {(Object.keys(PHASES) as PomPhase[]).map(p => (
          <button key={p} onClick={() => switchPhase(p)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold font-cabin transition-all",
              phase === p ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>
            {PHASES[p].label}
          </button>
        ))}
      </div>

      {/* SVG circle */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
          <motion.circle cx="90" cy="90" r="80" fill="none" stroke="currentColor" strokeWidth="8"
            strokeDasharray={circumference} strokeLinecap="round"
            className={PHASES[phase].color}
            animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            transition={{ duration: 0.5 }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black font-cabin tabular-nums ${PHASES[phase].color}`}>
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
          </span>
          <span className="text-xs text-zinc-400 font-poppins mt-1">{PHASES[phase].label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={() => setRunning(!running)}
          className={cn("px-8 py-3 rounded-2xl font-black font-cabin text-sm text-white shadow-lg transition-all active:scale-95",
            running ? "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600" : "bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700")}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} className="px-5 py-3 rounded-2xl font-bold font-cabin text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          Reset
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-500 font-poppins">
        <span className="flex items-center gap-1.5">
          🍅 <span className="font-bold text-zinc-700 dark:text-zinc-300">{sessions}</span> session{sessions !== 1 ? "s" : ""} completed today
        </span>
      </div>
    </div>
  );
}


type UnitCat = "length" | "mass" | "temperature" | "area";
const UNIT_CATS: Record<UnitCat, { label: string; units: string[]; convert: (v: number, from: string, to: string) => number }> = {
  length: {
    label: "Length",
    units: ["m", "km", "cm", "mm", "ft", "in", "yd", "mi"],
    convert: (v, from, to) => {
      const toM: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, yd: 0.9144, mi: 1609.344 };
      return v * (toM[from] / toM[to]);
    },
  },
  mass: {
    label: "Mass",
    units: ["kg", "g", "mg", "lb", "oz", "t"],
    convert: (v, from, to) => {
      const toKg: Record<string, number> = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, t: 1000 };
      return v * (toKg[from] / toKg[to]);
    },
  },
  temperature: {
    label: "Temperature",
    units: ["°C", "°F", "K"],
    convert: (v, from, to) => {
      const c = from === "°C" ? v : from === "°F" ? (v - 32) * 5 / 9 : v - 273.15;
      return to === "°C" ? c : to === "°F" ? c * 9 / 5 + 32 : c + 273.15;
    },
  },
  area: {
    label: "Area",
    units: ["m²", "km²", "cm²", "ft²", "in²", "ha", "acre"],
    convert: (v, from, to) => {
      const toSqM: Record<string, number> = { "m²": 1, "km²": 1e6, "cm²": 0.0001, "ft²": 0.092903, "in²": 0.00064516, ha: 10000, acre: 4046.86 };
      return v * (toSqM[from] / toSqM[to]);
    },
  },
};

function UnitConverter() {
  const [cat, setCat] = useState<UnitCat>("length");
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("km");
  const [input, setInput] = useState("1");
  const units = UNIT_CATS[cat].units;
  const result = isNaN(+input) ? "—" : UNIT_CATS[cat].convert(+input, from, to).toPrecision(6).replace(/\.?0+$/, "");

  const switchCat = (c: UnitCat) => { setCat(c); setFrom(UNIT_CATS[c].units[0]); setTo(UNIT_CATS[c].units[1]); };

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(UNIT_CATS) as UnitCat[]).map(c => (
          <button key={c} onClick={() => switchCat(c)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold font-cabin transition-all",
              cat === c ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400")}>
            {UNIT_CATS[c].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{ label: "From", val: from, set: setFrom }, { label: "To", val: to, set: setTo }].map(({ label, val, set }) => (
          <div key={label}>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1.5">{label}</p>
            <select value={val} onChange={e => set(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm outline-none">
              {units.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1.5">Value</p>
        <input type="number" value={input} onChange={e => setInput(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30" />
      </div>

      <motion.div key={result} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1">Result</p>
        <p className="text-2xl font-black font-cabin text-indigo-700 dark:text-indigo-300">{result} <span className="text-lg">{to}</span></p>
        <p className="text-xs text-zinc-400 mt-1">{input} {from} = {result} {to}</p>
      </motion.div>
    </div>
  );
}


function WordCounter() {
  const [text, setText] = useState("");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = text.split(/\n+/).filter(p => p.trim()).length;
  const readTime = Math.max(1, Math.ceil(words / 200));

  const stats = [
    { label: "Words", value: words },
    { label: "Characters", value: chars },
    { label: "No Spaces", value: charsNoSpaces },
    { label: "Sentences", value: sentences },
    { label: "Paragraphs", value: paragraphs },
    { label: "Read Time", value: `${readTime} min` },
  ];

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste or type your text here…"
        rows={7}
        className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-poppins text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
      />
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-center">
            <p className="text-lg font-black font-cabin text-zinc-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-[10px] text-zinc-400 font-cabin uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
      {text && (
        <button onClick={() => setText("")} className="w-full py-2.5 text-xs font-bold font-cabin uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
          Clear
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPS REGISTRY
═══════════════════════════════════════════════════════════ */
const APPS = [
  {
    id: "gpa" as AppId,
    icon: Calculator,
    label: "GPA Calculator",
    desc: "Compute your semester GPA on the UNIBEN 5.0 scale.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    border: "border-indigo-200 dark:border-indigo-800/40",
    component: <GPACalculator />,
  },
  {
    id: "pomodoro" as AppId,
    icon: Timer,
    label: "Pomodoro Timer",
    desc: "Focus in 25-minute sprints with structured breaks.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800/40",
    component: <PomodoroTimer />,
  },
  {
    id: "units" as AppId,
    icon: Ruler,
    label: "Unit Converter",
    desc: "Convert length, mass, temperature, and area instantly.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
    component: <UnitConverter />,
  },
  {
    id: "wordcount" as AppId,
    icon: FileText,
    label: "Word Counter",
    desc: "Count words, characters, sentences and estimate read time.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800/40",
    component: <WordCounter />,
  },
];

/* ── Main page ───────────────────────────────────────────── */
export default function MiniAppsPage() {
  const [active, setActive] = useState<AppId>(null);
  const app = APPS.find(a => a.id === active);

  return (
    <div className="flex-1 p-5 md:p-8 max-w-4xl mx-auto w-full space-y-8 font-poppins">

      {/* Header */}
      <div className="flex items-center gap-4">
        {active && (
          <button onClick={() => setActive(null)}
            className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-4 h-4 text-zinc-500" />
          </button>
        )}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">Tools</p>
          <h1 className="text-2xl md:text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
            {app ? app.label : "Mini Apps"}
          </h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!active ? (
          /* Grid of apps */
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {APPS.map((a, i) => (
              <motion.button key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setActive(a.id)}
                className={cn("text-left p-6 rounded-3xl border hover:scale-[1.02] active:scale-95 transition-all duration-200 group", a.bg, a.border)}>
                <div className={cn("w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center mb-4 border group-hover:shadow-md transition-shadow", a.border)}>
                  <a.icon className={cn("w-6 h-6", a.color)} />
                </div>
                <h3 className={cn("text-sm font-black font-cabin uppercase tracking-wider mb-1", a.color)}>{a.label}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{a.desc}</p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          /* App view */
          <motion.div key={active} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-6 md:p-8">
            {app?.component}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
