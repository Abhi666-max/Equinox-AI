"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { FileUpload } from "@/components/aceternity/file-upload";
import { HoverEffect } from "@/components/aceternity/hover-effect";
import { useAuditStore } from "@/store/useAuditStore";

type UploadResponse = {
  bias_score: number;
  demographic_parity_difference: number;
  disparate_impact_ratio: number;
  rows: number;
  columns: number;
  target?: string;
  sensitive_feature?: string;
  prediction?: string | null;
};
const API_BASE = "https://equinox-backend-y77g.onrender.com";

export default function DashboardHomePage() {
  const router = useRouter();
  const { auditData, setAuditData, setGeminiExplanation } = useAuditStore();
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [result, setResult] = React.useState<UploadResponse | null>(null);

  async function upload(file: File) {
    setIsUploading(true);
    setResult(null);
    const tId = toast.loading("Processing Dataset...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload-csv`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed (${res.status})`);
      }

      const data = (await res.json()) as UploadResponse;
      setResult(data);
      setAuditData(data);
      toast.success("Audit complete. Metrics generated.", { id: tId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      toast.error(message, { id: tId });
      setResult(null);
    } finally {
      setIsUploading(false);
    }
  }

  function onFileSelect(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }
    void upload(file);
  }

  async function downloadCompliancePdf() {
    setIsDownloading(true);
    const tId = toast.loading("Preparing compliance PDF...");
    try {
      const cur = result ?? auditData;
      const query = new URLSearchParams({
        bias_score: String(cur?.bias_score ?? 0),
        demographic_parity_difference: String(cur?.demographic_parity_difference ?? 0),
        disparate_impact_ratio: String(cur?.disparate_impact_ratio ?? 1),
        rows: String(cur?.rows ?? 0),
        columns: String(cur?.columns ?? 0),
      });
      const res = await fetch(`${API_BASE}/api/download-report?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = res.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      link.href = objectUrl;
      link.download = filenameMatch?.[1] ?? "ai_fairness_compliance_report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success("Compliance PDF downloaded.", { id: tId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Download failed";
      toast.error(message, { id: tId });
    } finally {
      setIsDownloading(false);
    }
  }

  async function generateExplainabilityReport() {
    const currentAudit = result ?? auditData;
    if (!currentAudit) {
      toast.error("Upload a dataset first.");
      return;
    }
    setIsGeneratingReport(true);
    const tId = toast.loading("Generating explainability analysis...");
    try {
      const res = await fetch(`${API_BASE}/api/explain-bias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bias_score: currentAudit.bias_score,
          demographic_parity_difference: currentAudit.demographic_parity_difference,
          disparate_impact_ratio: currentAudit.disparate_impact_ratio,
          rows: currentAudit.rows,
          columns: currentAudit.columns,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { explanation?: string; risk_summary?: string | null; roi_impact?: string | null };
      setGeminiExplanation({
        explanation: data.explanation ?? "Analysis ready. Review risk and ROI highlights.",
        riskSummary: data.risk_summary ?? null,
        roiImpact: data.roi_impact ?? null,
      });
      toast.success("Explainability generated.", { id: tId });
      router.push("/dashboard/reports");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Explainability failed", { id: tId });
    } finally {
      setIsGeneratingReport(false);
    }
  }

  const currentResult = result ?? auditData;
  const metricItems = currentResult
    ? [
        {
          title: "Bias Score",
          value: `${currentResult.bias_score}`,
          subtitle: "0 best → 100 worst",
        },
        {
          title: "Demographic Parity Difference",
          value: currentResult.demographic_parity_difference.toFixed(4),
          subtitle: "Lower magnitude is better",
        },
        {
          title: "Disparate Impact Ratio",
          value: currentResult.disparate_impact_ratio.toFixed(4),
          subtitle: "Closer to 1.0 is better",
        },
      ]
    : [];
  const riskBadge =
    currentResult && currentResult.bias_score >= 50 ? (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-orange-400/35 bg-gradient-to-r from-orange-500/25 to-red-600/20 px-3 text-xs font-medium text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.25)]">
        ⚠️ HIGH RISK
      </span>
    ) : currentResult ? (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-400/35 bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 px-3 text-xs font-medium text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
        ✅ PASS
      </span>
    ) : null;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 mx-auto w-full max-w-6xl space-y-6 bg-[#000000] bg-gradient-to-tr from-purple-900/10 to-transparent px-6"
    >
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Overview</h1>
          <p className="mt-1 text-sm text-white/60">
            Run AI bias audits with enterprise-grade visibility and controls.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.95)]" />
          System Status: Online
        </div>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 text-sm font-medium text-white/85">Dataset Intake</div>

        <FileUpload onFileSelect={onFileSelect} isUploading={isUploading} />
      </motion.section>

      {currentResult && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white/90">Bias Audit Results</div>
              <div className="mt-1 text-sm text-white/60">
                Target: <span className="text-white/80">{currentResult.target}</span>{" "}
                · Sensitive:{" "}
                <span className="text-white/80">{currentResult.sensitive_feature}</span>{" "}
                · Rows: <span className="text-white/80">{currentResult.rows}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void generateExplainabilityReport()}
                disabled={isGeneratingReport}
                className="inline-flex h-9 items-center rounded-full border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/25 to-purple-500/25 px-4 text-sm font-medium text-white transition hover:from-fuchsia-500/35 hover:to-purple-500/35"
              >
                {isGeneratingReport ? "Generating..." : "Generate AI Explainability"}
              </button>
              <button
                type="button"
                onClick={() => void downloadCompliancePdf()}
                disabled={isDownloading}
                className="inline-flex h-9 items-center rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 px-4 text-sm font-medium text-white transition hover:from-cyan-500/35 hover:to-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloading ? "Downloading..." : "Download Compliance PDF"}
              </button>
              {riskBadge}
            </div>
          </div>

          <HoverEffect items={metricItems} />
        </motion.section>
      )}
    </motion.main>
  );
}
