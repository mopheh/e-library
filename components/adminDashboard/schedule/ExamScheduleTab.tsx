"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GraduationCap, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ExamSchedule {
  id: string; facultyId: string; facultyName: string | null; calendarEventId: string | null;
  session: string; semester: string; examDate: string; startTime: string | null;
  endTime: string | null; venue: string | null; notes: string | null;
}
interface CalendarEvent { id: string; activity: string; startDate: string; }
interface Faculty { id: string; name: string; }

interface Props {
  schedules: ExamSchedule[]; calendarEvents: CalendarEvent[];
  faculties: Faculty[]; loading: boolean; onRefresh: () => void;
}

const empty = { facultyId: "", calendarEventId: "", session: "2025/2026", semester: "FIRST", examDate: "", startTime: "", endTime: "", venue: "", notes: "" };

export default function ExamScheduleTab({ schedules, calendarEvents, faculties, loading, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const examEvents = calendarEvents.filter(e => (e as any).category === "exam");

  const handleSave = async () => {
    if (!form.facultyId || !form.examDate) { toast.error("Faculty and exam date required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/exam-schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, calendarEventId: form.calendarEventId || null }) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Exam schedule added"); setShowForm(false); setForm(empty); onRefresh();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam schedule?")) return;
    try { await fetch(`/api/admin/exam-schedules?id=${id}`, { method: "DELETE" }); toast.success("Deleted"); onRefresh(); }
    catch { toast.error("Failed"); }
  };

  const pickFromCalendar = (eventId: string) => {
    const ev = calendarEvents.find(e => e.id === eventId);
    if (ev) setForm(f => ({ ...f, calendarEventId: eventId, examDate: ev.startDate }));
  };

  const inp = "w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">Exam Timetable</h2>
          <p className="text-xs text-zinc-400 font-poppins mt-0.5">Faculty-specific exam dates — pick from the academic calendar or enter manually.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Schedule
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
              {/* Pick from calendar */}
              {examEvents.length > 0 && (
                <div>
                  <label className={lbl}>Pick from Calendar (exam events)</label>
                  <select onChange={e => pickFromCalendar(e.target.value)} className={inp} defaultValue="">
                    <option value="" disabled>Select a calendar event…</option>
                    {examEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.activity} — {new Date(ev.startDate).toLocaleDateString("en-NG", { dateStyle: "medium" })}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Faculty</label>
                  <select value={form.facultyId} onChange={e => setForm(f => ({...f, facultyId: e.target.value}))} className={inp}>
                    <option value="" disabled>Select faculty…</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Exam Date</label><input type="date" value={form.examDate} onChange={e => setForm(f => ({...f, examDate: e.target.value}))} className={inp} /></div>
                <div><label className={lbl}>Start Time</label><input type="time" value={form.startTime} onChange={e => setForm(f => ({...f, startTime: e.target.value}))} className={inp} /></div>
                <div><label className={lbl}>End Time</label><input type="time" value={form.endTime} onChange={e => setForm(f => ({...f, endTime: e.target.value}))} className={inp} /></div>
                <div><label className={lbl}>Venue</label><input value={form.venue} onChange={e => setForm(f => ({...f, venue: e.target.value}))} className={inp} placeholder="e.g. Faculty Hall A" /></div>
                <div><label className={lbl}>Session</label><input value={form.session} onChange={e => setForm(f => ({...f, session: e.target.value}))} className={inp} /></div>
              </div>
              <div><label className={lbl}>Notes</label><input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className={inp} placeholder="Additional info…" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400 hover:text-zinc-700 transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-black font-cabin uppercase tracking-widest shadow-md hover:bg-rose-700 transition-all disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-2">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse">
            <div className="w-14 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-lg" /></div>
          </div>
        )) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
            <p className="text-sm font-bold font-cabin text-zinc-400 uppercase tracking-wider">No exam schedules</p>
          </div>
        ) : schedules.map((s, i) => {
          const d = new Date(s.examDate);
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 font-cabin leading-none">{d.toLocaleDateString("en", { month: "short" }).toUpperCase()}</span>
                <span className="text-lg font-black font-cabin text-rose-600 dark:text-rose-400 leading-tight">{d.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-poppins truncate">{s.facultyName || "Unknown Faculty"}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] text-zinc-400 font-poppins">
                  {s.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.startTime}{s.endTime ? ` – ${s.endTime}` : ""}</span>}
                  {s.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.venue}</span>}
                  <span>{s.semester} · {s.session}</span>
                </div>
                {s.notes && <p className="text-[10px] text-zinc-400 font-poppins mt-1 truncate">{s.notes}</p>}
              </div>
              <button onClick={() => handleDelete(s.id)} className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
