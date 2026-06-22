"use client";

import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";
import {
  BookOpen,
  Download,
  User,
  Calendar,
  FileText,
  Layers,
  ArrowRight,
  X,
  Eye,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  BookMarked,
  Hash,
} from "lucide-react";
import { Book } from "@/types";
import Image from "next/image";


// ── Type color palette ──────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { gradient: string; badge: string; icon: React.ElementType }
> = {
  "text book": {
    gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    badge:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: BookOpen,
  },
  handout: {
    gradient: "from-violet-600 via-purple-500 to-fuchsia-500",
    badge:
      "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    icon: FileText,
  },
  "past question": {
    gradient: "from-orange-600 via-amber-500 to-yellow-400",
    badge:
      "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: Layers,
  },
  material: {
    gradient: "from-rose-600 via-pink-500 to-fuchsia-400",
    badge:
      "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: FileText,
  },
};

const getTypeConfig = (type?: string) =>
  TYPE_CONFIG[type?.toLowerCase() ?? ""] ?? {
    gradient: "from-blue-600 via-indigo-500 to-violet-500",
    badge:
      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: BookOpen,
  };

// ── Parse-status pill ──────────────────────────────────────────────────────
const ParseStatusPill = ({
  status,
}: {
  status?: Book["parseStatus"] | null;
}) => {
  if (!status || status === "completed") return null;

  const map: Record<
    string,
    { label: string; color: string; icon: React.ElementType }
  > = {
    pending: {
      label: "Pending",
      color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800",
      icon: Clock,
    },
    parsing: {
      label: "Processing",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
      icon: Loader2,
    },
    parsed: {
      label: "Parsed",
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
      icon: CheckCircle2,
    },
    generating_questions: {
      label: "Generating AI",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
      icon: Loader2,
    },
    processing: {
      label: "Processing",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
      icon: Loader2,
    },
    failed: {
      label: "Failed",
      color: "text-red-600 bg-red-50 dark:bg-red-900/30",
      icon: AlertCircle,
    },
  };

  const cfg = map[status] ?? map.pending;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}
    >
      <Icon
        className={`w-3 h-3 ${status.includes("ing") ? "animate-spin" : ""}`}
      />
      {cfg.label}
    </span>
  );
};

// ── Stat chip ──────────────────────────────────────────────────────────────
const StatChip = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3">
    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-semibold uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span className="text-sm font-semibold text-zinc-900 dark:text-white leading-none truncate">
      {value}
    </span>
  </div>
);

// ── Main modal ─────────────────────────────────────────────────────────────
interface BookPreviewModalProps {
  book?: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReader: (id: string) => void;
}

export const BookPreviewModal = ({
  book,
  isOpen,
  onClose,
  onOpenReader,
}: BookPreviewModalProps) => {
  const handleOpen = useCallback(() => {
    if (book) onOpenReader(book.id);
  }, [book, onOpenReader]);

  if (!book) return null;

  const cfg = getTypeConfig(book.type);
  const TypeIcon = cfg.icon;
  const fakeReads = book.readCount ?? Math.floor(Math.random() * 480) + 40;
  const fakeRating = (4 + Math.random()).toFixed(1);
  const uploaderName = book.postedByDetails?.fullName ?? "RCF Admin";
  const uploaderInitials = uploaderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`
          max-w-lg p-0 overflow-hidden gap-0
          bg-white dark:bg-[#0d0d10]
          border border-zinc-200/80 dark:border-zinc-800/80
          shadow-2xl shadow-black/20 dark:shadow-black/60
          rounded-2xl
        `}
        showCloseButton={false}
      >
        {/* ── Hero Banner ─────────────────────────────────────────── */}
        <div
          className={`relative h-36 bg-gradient-to-br ${cfg.gradient} overflow-hidden`}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Type badge */}
          <div className="absolute top-3 left-4">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20">
              <TypeIcon className="w-3 h-3" />
              {book.type}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Quick stats row */}
          <div className="absolute bottom-3 right-4 flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-white/80 text-[11px]">
              <Eye className="w-3.5 h-3.5" />
              {fakeReads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-[11px]">
              <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
              {fakeRating}
            </span>
            {book.pageCount && (
              <span className="flex items-center gap-1 text-white/80 text-[11px]">
                <FileText className="w-3.5 h-3.5" />
                {book.pageCount}p
              </span>
            )}
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="relative px-6 pt-5 pb-6">
          {/* Floating cover thumbnail */}
          <div
            className={`
              absolute -top-9 left-5
              h-[4.5rem] w-[3.4rem]
              rounded-xl overflow-hidden
              border-2 border-white dark:border-[#0d0d10]
              shadow-lg shadow-black/20
              ring-1 ring-zinc-200/50 dark:ring-zinc-700/50
              bg-gradient-to-br ${cfg.gradient}
              flex items-center justify-center
              shrink-0
            `}
          >
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover"
              />
            ) : (
              <TypeIcon className="w-6 h-6 text-white/90" />
            )}
          </div>

          {/* Title area */}
          <div className="ml-[3.8rem]">
            <div className="flex items-center gap-2 flex-wrap">
              <ParseStatusPill status={book.parseStatus} />
              {book.course && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <Hash className="w-2.5 h-2.5" />
                  {book.course}
                </span>
              )}
            </div>
          </div>

          <DialogHeader className="mt-3 space-y-0">
            <DialogTitle className="text-xl font-bold font-josefin-sans leading-snug text-zinc-900 dark:text-white pr-2">
              {book.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed line-clamp-3">
              {book.description ||
                "No description was provided for this resource. It is categorized under its specific course code and department."}
            </DialogDescription>
          </DialogHeader>

          {/* ── Metadata grid ──────────────────────────────────── */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <StatChip
              icon={BookMarked}
              label="Dept / Course"
              value={book.course || book.department?.name || "General"}
            />
            <StatChip
              icon={Layers}
              label="File Size"
              value={
                book.fileSize ? (
                  <span className="font-mono">{formatBytes(book.fileSize)}</span>
                ) : (
                  "PDF"
                )
              }
            />
            <StatChip
              icon={Calendar}
              label="Date Added"
              value={new Date(book.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
            <StatChip
              icon={User}
              label="Uploaded By"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className={`
                      inline-flex items-center justify-center
                      w-5 h-5 rounded-full text-[9px] font-bold text-white
                      bg-gradient-to-br ${cfg.gradient}
                      shrink-0
                    `}
                  >
                    {uploaderInitials}
                  </span>
                  <span className="truncate">{uploaderName}</span>
                </span>
              }
            />
          </div>

          {/* ── Action buttons ─────────────────────────────────── */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleOpen}
              className={`
                flex-1 relative overflow-hidden
                bg-gradient-to-r ${cfg.gradient}
                text-white font-semibold text-sm
                py-2.5 rounded-xl
                shadow-md shadow-black/10
                hover:shadow-lg hover:shadow-black/20
                hover:brightness-110
                active:scale-[0.98]
                transition-all duration-200
                flex items-center justify-center gap-2
              `}
            >
              <BookOpen className="w-4 h-4" />
              Open Reader
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>

            <button
              className="
                flex items-center justify-center gap-2
                px-5 py-2.5 rounded-xl
                text-zinc-700 dark:text-zinc-200 font-semibold text-sm
                bg-zinc-100 dark:bg-zinc-800/80
                hover:bg-zinc-200 dark:hover:bg-zinc-700
                border border-zinc-200 dark:border-zinc-700
                active:scale-[0.98]
                transition-all duration-200
              "
              title="Download"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          {/* ── Footer note ────────────────────────────────────── */}
          <p className="mt-4 text-center text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
            This material is for academic use only and is governed by the RCF
            E-Library policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
