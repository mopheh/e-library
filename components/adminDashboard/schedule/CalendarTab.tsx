"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, ChevronDown, Edit2, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["lecture","exam","registration","break","orientation","matriculation","revision","result","other"] as const;
const CAT_COLORS: Record<string, string> = {
  lecture: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  exam: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  registration: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  break: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  orientation: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  matriculation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  revision: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  result: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

interface CalendarEvent {
  id: string; session: string; semester: string | null; startDate: string;
  endDate: string | null; activity: string; category: string; isPublished: boolean;
}

interface Props {
  events: CalendarEvent[];
  loading: boolean;
  onRefresh: () => void;
}

const empty = { session: "2025/2026", semester: "FIRST", startDate: "", endDate: "", activity: "", category: "other", isPublished: false };

export default function CalendarTab({ events, loading, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [semFilter, setSemFilter] = useState<string>("ALL");

  const filtered = semFilter === "ALL" ? events : events.filter(e => e.semester === semFilter);

  const handleSave = async () => {
    if (!form.startDate || !form.activity) { toast.error("Date and activity required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Event added"); setShowForm(false); setForm(empty); onRefresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this calendar event?")) return;
    try {
      await fetch(`/api/admin/calendar?id=${id}`, { method: "DELETE" });
      toast.success("Deleted"); onRefresh();
    } catch { toast.error("Failed to delete"); }
  };

  const togglePublish = async (ev: CalendarEvent) => {
    try {
      await fetch("/api/admin/calendar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ev.id, isPublished: !ev.isPublished }) });
      onRefresh();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">School Calendar</h2>
          <p className="text-xs text-zinc-400 font-poppins mt-0.5">Academic session events — lectures, exams, breaks, etc.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Event
        </button>
      </div>

      {/* Semester filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL","FIRST","SECOND"].map(s => (
          <button key={s} onClick={() => setSemFilter(s)} className={`px-4 py-2 rounded-xl font-black font-cabin text-[10px] uppercase tracking-widest transition-all ${semFilter === s ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>
            {s === "ALL" ? "All Semesters" : `${s} Semester`}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Session</label>
                  <input value={form.session} onChange={e => setForm(f => ({...f, session: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200" placeholder="2025/2026" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Semester</label>
                  <select value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200">
                    <option value="FIRST">First</option><option value="SECOND">Second</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">End Date (optional)</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Activity</label>
                <input value={form.activity} onChange={e => setForm(f => ({...f, activity: e.target.value}))} className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200" placeholder="e.g. Lectures begin in all Faculties" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setForm(f => ({...f, category: c}))} className={`px-3 py-1.5 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest transition-all ${form.category === c ? CAT_COLORS[c] + " ring-2 ring-offset-1 ring-zinc-900/10" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400 hover:text-zinc-700 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black font-cabin uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {saving ? "Saving…" : "Save Event"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse">
              <div className="w-14 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2"><div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" /><div className="h-2 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-lg" /></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
            <p className="text-sm font-bold font-cabin text-zinc-400 uppercase tracking-wider">No events yet</p>
            <p className="text-xs text-zinc-400 mt-1 font-poppins">Add academic calendar events above</p>
          </div>
        ) : (
          filtered.map((ev, i) => {
            const d = new Date(ev.startDate);
            const month = d.toLocaleDateString("en", { month: "short" }).toUpperCase();
            const day = d.getDate();
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                {/* Date tile */}
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin leading-none">{month}</span>
                  <span className="text-lg font-black font-cabin text-zinc-800 dark:text-zinc-100 leading-tight">{day}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-poppins truncate">{ev.activity}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${CAT_COLORS[ev.category || "other"]}`}>{ev.category}</span>
                    {ev.endDate && <span className="text-[10px] text-zinc-400 font-poppins">→ {new Date(ev.endDate).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>}
                    <span className="text-[10px] text-zinc-400 font-poppins">· {ev.semester || "Session"}</span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => togglePublish(ev)} className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${ev.isPublished ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"}`}>
                    {ev.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(ev.id)} className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
