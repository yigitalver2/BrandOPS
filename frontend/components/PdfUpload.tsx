"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listReports, uploadReport, deleteReport } from "@/lib/api";

type UploadItem = {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  size?: number;
};

export default function PdfUpload() {
  const [reports, setReports] = useState<string[]>([]);
  const [uploading, setUploading] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  async function refresh() {
    try {
      const data = await listReports();
      setReports(data.reports);
      setLoadError(null);
    } catch {
      setLoadError("Could not reach the backend — is it running?");
    }
  }

  useEffect(() => { refresh(); }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const pdfs = Array.from(files).filter((f) => f.name.endsWith(".pdf"));
    if (!pdfs.length) return;

    const items: UploadItem[] = pdfs.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      status: "uploading",
      progress: 0,
    }));
    setUploading((prev) => [...prev, ...items]);

    await Promise.all(
      pdfs.map(async (file, i) => {
        const item = items[i];
        try {
          await uploadReport(file, (pct) => {
            setUploading((prev) =>
              prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))
            );
          });
          setUploading((prev) =>
            prev.map((u) =>
              u.id === item.id ? { ...u, status: "done", progress: 100 } : u
            )
          );
          await refresh();
        } catch (e) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === item.id
                ? { ...u, status: "error", error: String(e) }
                : u
            )
          );
        }
      })
    );

    // Clear completed/errored items after 3s
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.status === "uploading"));
    }, 3000);
  }, []);

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function onDelete(name: string) {
    try {
      await deleteReport(name);
      await refresh();
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="space-y-4">
      {/* Drag & drop zone */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer select-none overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-copper bg-copper/5"
            : "border-espresso-600 hover:border-copper/60 hover:bg-espresso-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="pointer-events-none flex flex-col items-center gap-3">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl transition-colors ${
            dragging ? "bg-copper text-white" : "bg-espresso-700 text-copper-dark"
          }`}>
            <PdfIcon />
          </div>
          <div>
            <p className="font-medium text-cream-100">
              {dragging ? "Drop here" : "Upload PDF"}
            </p>
            <p className="mt-1 text-sm text-cream-200/55">
              Drag & drop or click · annual report PDFs
            </p>
          </div>
          {!dragging && (
            <span className="rounded-full border border-espresso-600 px-4 py-1.5 text-sm text-cream-200/70">
              Choose file
            </span>
          )}
        </div>
      </div>

      {/* Active upload items */}
      <AnimatePresence>
        {uploading.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden p-4"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-espresso-700 text-copper-dark">
                <PdfIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-cream-100">{item.name}</p>
                {item.status === "uploading" && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-espresso-700">
                    <motion.div
                      className="h-full rounded-full bg-copper"
                      style={{ width: `${item.progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                )}
                {item.status === "error" && (
                  <p className="mt-0.5 text-xs text-rose-400">{item.error}</p>
                )}
              </div>
              {item.status === "done" && <Check />}
              {item.status === "uploading" && (
                <span className="shrink-0 font-mono text-xs text-cream-200/50">
                  {Math.round(item.progress)}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Uploaded files */}
      {loadError ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-50/40 px-4 py-3 text-sm text-rose-600">
          {loadError}
        </p>
      ) : reports.length > 0 ? (
        <div className="card divide-y divide-espresso-600/60 overflow-hidden p-0">
          <p className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-cream-200/50">
            Uploaded reports ({reports.length})
          </p>
          {reports.map((name) => (
            <motion.div
              key={name}
              layout
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-espresso-700 text-copper-dark">
                <PdfIcon size={16} />
              </div>
              <span className="flex-1 truncate text-sm text-cream-100">{name}</span>
              <button
                onClick={() => onDelete(name)}
                className="shrink-0 rounded-full p-1.5 text-cream-200/40 transition-colors hover:bg-rose-50 hover:text-rose-500"
                title="Delete"
              >
                <Trash />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-cream-200/40">
          No reports uploaded yet — pipeline runs with mock data.
        </p>
      )}
    </div>
  );
}

function PdfIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="12" y2="17" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Trash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
