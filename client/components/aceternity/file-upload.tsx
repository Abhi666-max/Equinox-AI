"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";

type FileUploadProps = {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  className?: string;
};

export function FileUpload({
  onFileSelect,
  isUploading = false,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  function handleFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) return;
    onFileSelect(file);
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-10 shadow-2xl backdrop-blur-xl transition-all",
          isDragging
            ? "border-fuchsia-300/40 bg-fuchsia-500/[0.08] shadow-[0_0_0_1px_rgba(217,70,239,0.35),0_0_70px_-45px_rgba(217,70,239,0.8)]"
            : "hover:border-white/20 hover:bg-white/[0.04]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.18),transparent_58%),radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.12),transparent_55%)] opacity-80" />

        {isUploading ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 shadow-[0_0_70px_-26px_rgba(34,211,238,0.95)]">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
            </div>
            <h3 className="text-xl font-medium text-white">Processing Dataset...</h3>
            <p className="mt-2 text-sm text-white/65">
              Running fairness diagnostics and bias metric extraction.
            </p>
          </motion.div>
        ) : (
          <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 shadow-[0_0_60px_-25px_rgba(217,70,239,0.9)]">
              <UploadCloud className="h-7 w-7 text-fuchsia-200" />
            </div>
            <h3 className="text-xl font-medium text-white">
              Drop your CSV to start bias audit
            </h3>
            <p className="mt-2 text-sm text-white/65">
              Aceternity-style intake. Drag & drop or click to upload.
            </p>
            <div className="mt-5 rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/15 px-5 py-2 text-sm text-white">
              Select CSV File
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
