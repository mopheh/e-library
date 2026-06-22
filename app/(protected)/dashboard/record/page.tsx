"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  Volume2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REC_KEY = "rcf_recordings";

interface Recording {
  id: string;
  name: string;
  blob: string; // base64 data URL
  duration: number; // seconds
  notes: string;
  createdAt: string;
  size: number;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Waveform visualizer ─────────────────────────────────── */
function WaveformBar({ isRecording }: { isRecording: boolean }) {
  const bars = 28;
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={cn("w-[3px] rounded-full", isRecording ? "bg-red-500" : "bg-zinc-300 dark:bg-zinc-700")}
          animate={isRecording ? {
            height: ["8px", `${Math.random() * 36 + 8}px`, "8px"],
          } : { height: "8px" }}
          transition={{
            duration: 0.5 + Math.random() * 0.4,
            repeat: isRecording ? Infinity : 0,
            delay: (i / bars) * 0.3,
            ease: "easeInOut",
          }}
          style={{ height: "8px" }}
        />
      ))}
    </div>
  );
}

/* ── Recording card ──────────────────────────────────────── */
function RecordingCard({ rec, onDelete, onUpdateNotes }: {
  rec: Recording;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded]   = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [notes, setNotes]         = useState(rec.notes);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = rec.blob;
    a.download = `${rec.name}.webm`;
    a.click();
  };

  const saveNotes = () => onUpdateNotes(rec.id, notes);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <audio
        ref={audioRef}
        src={rec.blob}
        onTimeUpdate={e => {
          const el = e.currentTarget;
          setCurrentTime(el.currentTime);
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
      />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-4">
          <button
            onClick={togglePlay}
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all",
              isPlaying
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
            )}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate font-cabin">{rec.name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Clock className="w-3 h-3" /> {formatDuration(rec.duration)}
              </span>
              <span className="text-[11px] text-zinc-400">{formatBytes(rec.size)}</span>
              <span className="text-[11px] text-zinc-400">
                {new Date(rec.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={download} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={() => onDelete(rec.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", isPlaying ? "bg-red-500" : "bg-indigo-500")}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-400">{formatDuration(currentTime)}</span>
          <span className="text-[10px] text-zinc-400">{formatDuration(rec.duration)}</span>
        </div>
      </div>

      {/* Notes panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Lecture Notes
                </p>
                <button
                  onClick={saveNotes}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Jot down key points from this lecture…"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-poppins text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function RecordLecturePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused]       = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [recordings, setRecordings]   = useState<Recording[]>([]);
  const [recName, setRecName]         = useState("");
  const [permissionDenied, setPermDenied] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRef     = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  /* Load saved recordings */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REC_KEY);
      if (raw) setRecordings(JSON.parse(raw));
    } catch {}
  }, []);

  const saveRecordings = (list: Recording[]) => {
    setRecordings(list);
    try { localStorage.setItem(REC_KEY, JSON.stringify(list)); } catch {}
  };

  /* Timer */
  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  /* Request mic permission */
  const checkPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setHasPermission(true);
    } catch {
      setHasPermission(false);
      setPermDenied(true);
    }
  }, []);

  useEffect(() => { checkPermission(); }, [checkPermission]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => finishRecording();
      mr.start(250);
      mediaRef.current = mr;
      setIsRecording(true);
      setIsPaused(false);
      setElapsed(0);
      startTimer();
    } catch {
      setPermDenied(true);
    }
  };

  const pauseResume = () => {
    if (!mediaRef.current) return;
    if (isPaused) {
      mediaRef.current.resume();
      startTimer();
    } else {
      mediaRef.current.pause();
      stopTimer();
    }
    setIsPaused(!isPaused);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    stopTimer();
    setIsRecording(false);
    setIsPaused(false);
  };

  const finishRecording = () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onloadend = () => {
      const rec: Recording = {
        id: crypto.randomUUID(),
        name: recName.trim() || `Lecture ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
        blob: reader.result as string,
        duration: elapsed,
        notes: "",
        createdAt: new Date().toISOString(),
        size: blob.size,
      };
      saveRecordings([rec, ...recordings]);
      setRecName("");
      setElapsed(0);
    };
    reader.readAsDataURL(blob);
  };

  const deleteRec = (id: string) => saveRecordings(recordings.filter(r => r.id !== id));
  const updateNotes = (id: string, notes: string) =>
    saveRecordings(recordings.map(r => r.id === id ? { ...r, notes } : r));

  return (
    <div className="flex-1 p-5 md:p-8 max-w-3xl mx-auto w-full space-y-8 font-poppins">

      {/* Header */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">Tools</p>
        <h1 className="text-2xl md:text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
          Record Lecture
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Capture audio and jot notes — recordings are saved locally on your device.
        </p>
      </div>

      {/* Recorder card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-8">

        {/* Permission denied */}
        {permissionDenied && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl text-sm text-red-700 dark:text-red-400 font-medium">
            🎤 Microphone access denied. Please allow microphone permission in your browser settings.
          </div>
        )}

        {/* Recording name */}
        {!isRecording && (
          <div className="mb-6">
            <input
              value={recName}
              onChange={e => setRecName(e.target.value)}
              placeholder="Recording name (optional)…"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-poppins text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        )}

        {/* Waveform + timer */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-full">
            <WaveformBar isRecording={isRecording && !isPaused} />
          </div>

          <div className={cn(
            "text-4xl font-black font-cabin tabular-nums tracking-tight transition-colors",
            isRecording && !isPaused ? "text-red-500" : "text-zinc-300 dark:text-zinc-700"
          )}>
            {formatDuration(elapsed)}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-2.5 h-2.5 rounded-full bg-red-500"
              />
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest font-cabin">
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={hasPermission === false}
                className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black font-cabin text-sm rounded-2xl transition-all shadow-xl shadow-red-500/30 hover:scale-[1.03] active:scale-95"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={pauseResume}
                  className="flex items-center gap-2 px-6 py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold font-cabin text-sm rounded-2xl transition-all"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold font-cabin text-sm rounded-2xl transition-all shadow-lg shadow-red-500/20"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Stop & Save
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-4">
            {recordings.length} Recording{recordings.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            <AnimatePresence>
              {recordings.map(rec => (
                <RecordingCard
                  key={rec.id}
                  rec={rec}
                  onDelete={deleteRec}
                  onUpdateNotes={updateNotes}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {recordings.length === 0 && !isRecording && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-3xl">
            🎙️
          </div>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 font-cabin">No recordings yet</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">Start your first recording and your lectures will appear here with playback and notes.</p>
        </div>
      )}
    </div>
  );
}
