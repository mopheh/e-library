"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, FileText, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";

interface Timetable {
  id: string; departmentId: string | null; departmentName: string | null;
  facultyId: string | null; facultyName: string | null; session: string;
  semester: string; level: string | null; title: string;
  fileUrl: string | null; fileType: string | null;
}
interface Faculty { id: string; name: string; }
interface Dept { id: string; name: string; }

interface Props {
  timetables: Timetable[]; faculties: Faculty[]; departments: Dept[];
  loading: boolean; onRefresh: () => void;
}

const LEVELS = ["100","200","300","400","500","600"];
const empty = { departmentId: "", facultyId: "", session: "2025/2026", semester: "FIRST" as string, level: "", title: "", fileUrl: "", fileType: "pdf" };

export default function TimetableTab({ timetables, faculties, departments, loading, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"ALL"|"CLASS"|"EXAM">("ALL");

  const filtered = timetables.filter(t => {
    if (typeFilter === "CLASS") return t.title.toLowerCase().includes("class") || t.title.toLowerCase().includes("lecture");
    if (typeFilter === "EXAM") return t.title.toLowerCase().includes("exam");
    return true;
  });

  const handleSave = async () => {
    if (!form.title || !form.session) { toast.error("Title and session required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/timetables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, departmentId: form.departmentId || null, facultyId: form.facultyId || null, level: form.level || null }) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Timetable added"); setShowForm(false); setForm(empty); onRefresh();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this timetable entry?")) return;
    try { await fetch(`/api/admin/timetables?id=${id}`, { method: "DELETE" }); toast.success("Deleted"); onRefresh(); }
    catch { toast.error("Failed"); }
  };

  const inp = "w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-poppins outline-none focus:ring-2 ring-indigo-500/20 text-zinc-700 dark:text-zinc-200";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin block mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">Timetables</h2>
          <p className="text-xs text-zinc-400 font-poppins mt-0.5">Upload class and exam timetables per department, level, and semester.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {(["ALL","CLASS","EXAM"] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-2 rounded-xl font-black font-cabin text-[10px] uppercase tracking-widest transition-all ${typeFilter === t ? "bg-blue-600 text-white shadow-md" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"}`}>
            {t === "ALL" ? "All" : t === "CLASS" ? "Class" : "Exam"}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
              <div><label className={lbl}>Title</label><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={inp} placeholder="e.g. 300L Class Timetable — First Semester" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={lbl}>Session</label><input value={form.session} onChange={e => setForm(f => ({...f, session: e.target.value}))} className={inp} /></div>
                <div><label className={lbl}>Semester</label>
                  <select value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))} className={inp}>
                    <option value="FIRST">First</option><option value="SECOND">Second</option>
                  </select>
                </div>
                <div><label className={lbl}>Level</label>
                  <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className={inp}>
                    <option value="">All levels</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}L</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Faculty</label>
                  <select value={form.facultyId} onChange={e => setForm(f => ({...f, facultyId: e.target.value}))} className={inp}>
                    <option value="">None</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Department</label>
                  <select value={form.departmentId} onChange={e => setForm(f => ({...f, departmentId: e.target.value}))} className={inp}>
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lbl}>File URL</label><input value={form.fileUrl} onChange={e => setForm(f => ({...f, fileUrl: e.target.value}))} className={inp} placeholder="https://drive.google.com/..." /></div>
                <div><label className={lbl}>File Type</label>
                  <select value={form.fileType} onChange={e => setForm(f => ({...f, fileType: e.target.value}))} className={inp}>
                    <option value="pdf">PDF</option><option value="image">Image</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black font-cabin uppercase tracking-widest shadow-md hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving…" : "Upload"}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timetable list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse h-28" />
        )) : filtered.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
            <p className="text-sm font-bold font-cabin text-zinc-400 uppercase tracking-wider">No timetables uploaded</p>
          </div>
        ) : filtered.map((tt, i) => (
          <motion.div key={tt.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="group relative p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-poppins truncate">{tt.title}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black font-cabin uppercase tracking-widest text-zinc-500">{tt.semester}</span>
                  {tt.level && <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-[9px] font-black font-cabin uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{tt.level}L</span>}
                  {tt.departmentName && <span className="text-[10px] text-zinc-400 font-poppins">{tt.departmentName}</span>}
                  {tt.facultyName && <span className="text-[10px] text-zinc-400 font-poppins">· {tt.facultyName}</span>}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {tt.fileUrl && (
                <a href={tt.fileUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={() => handleDelete(tt.id)} className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
