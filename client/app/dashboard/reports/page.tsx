"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Download, FileJson } from "lucide-react";
import { toast } from "sonner";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useAuditStore } from "@/store/useAuditStore";

const API_BASE = "https://equinox-backend-y77g.onrender.com";

export default function ReportsPage() {
  const { auditData, geminiExplanation, riskSummary, roiImpact, setGeminiExplanation } = useAuditStore();
  const [mounted, setMounted] = React.useState(false);
  const [loadingExplain, setLoadingExplain] = React.useState(false);
  const [loadingPdf, setLoadingPdf] = React.useState(false);
  const [score, setScore] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const bias = Number(auditData?.bias_score ?? 100);
    setScore(Math.max(0, Math.min(100, 100 - bias)));
  }, [auditData]);

  const metrics = auditData ?? {
    bias_score: 0,
    demographic_parity_difference: 0,
    disparate_impact_ratio: 1,
    rows: 0,
    columns: 0,
  };
  const explanation = geminiExplanation ?? "Generate AI explainability to receive business-ready analysis here.";
  const cleanText = (txt: string) => txt.replace(/\*\*/g, "").trim();

  const complianceData = [{ name: "Compliance", value: score, fill: "#38bdf8" }];
  const euAiActPass = score >= 70;
  const nistPass = score >= 70;

  async function generateExplainability() {
    setLoadingExplain(true);
    const tId = toast.loading("Generating Gemini explainability...");
    try {
      const res = await fetch(`${API_BASE}/api/explain-bias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      let data: {
        explanation?: string;
        risk_summary?: string | null;
        roi_impact?: string | null;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }
      const expl =
        typeof data.explanation === "string" && data.explanation.trim()
          ? cleanText(data.explanation)
          : "Analysis ready. Review risk and ROI highlights below.";
      const rs = typeof data.risk_summary === "string" ? data.risk_summary : null;
      const roi = typeof data.roi_impact === "string" ? data.roi_impact : null;
      setGeminiExplanation({
        explanation: expl,
        riskSummary: rs ? cleanText(rs) : null,
        roiImpact: roi ? cleanText(roi) : null,
      });
      toast.success("Explainability generated.", { id: tId });
    } catch {
      toast.dismiss(tId);
    } finally {
      setLoadingExplain(false);
    }
  }

  async function downloadExecutivePdf() {
    setLoadingPdf(true);
    const tId = toast.loading("Building executive PDF...");
    try {
      const params = new URLSearchParams({
        bias_score: String(metrics.bias_score),
        demographic_parity_difference: String(metrics.demographic_parity_difference),
        disparate_impact_ratio: String(metrics.disparate_impact_ratio),
        rows: String(metrics.rows),
        columns: String(metrics.columns),
      });
      const res = await fetch(`${API_BASE}/api/download-report?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "equinox_executive_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Executive PDF downloaded.", { id: tId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF generation failed", { id: tId });
    } finally {
      setLoadingPdf(false);
    }
  }

  function exportModelCard() {
    const modelCard = {
      model_name: "Equinox AI Bias Auditor",
      version: "2.4.0",
      generated_at: new Date().toISOString(),
      owner: "Equinox AI",
      metrics,
      compliance_score: score,
      intended_use: "Enterprise bias auditing, mitigation, and governance reporting",
      limitations: [
        "Results depend on data quality and selected sensitive attributes.",
        "Human governance review is required before production decisions.",
      ],
    };
    const blob = new Blob([JSON.stringify(modelCard, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "equinox_model_card.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("AI Model Card exported.");
  }

  if (!auditData) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-6xl space-y-6 bg-[#000000] bg-gradient-to-tr from-purple-900/10 to-transparent px-6"
      >
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Awaiting Dataset</h2>
          <p className="mt-2 text-sm text-white/65">
            Please run an audit from the Overview console.
          </p>
        </section>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 mx-auto w-full max-w-6xl space-y-6 bg-[#000000] bg-gradient-to-tr from-purple-900/10 to-transparent px-6"
    >
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Explainability & ROI</h1>
          <p className="mt-1 text-sm text-white/60">
            Executive-ready narrative insights and compliance performance indicators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportModelCard}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-300/35 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 px-4 text-sm font-medium text-white transition hover:from-violet-500/30 hover:to-fuchsia-500/30"
          >
            <FileJson className="h-4 w-4" />
            Export AI Model Card (JSON)
          </button>
          <button
            type="button"
            onClick={() => void downloadExecutivePdf()}
            disabled={loadingPdf}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-cyan-300/35 bg-gradient-to-r from-cyan-400/25 to-blue-500/25 px-4 text-sm font-medium text-white transition hover:from-cyan-400/35 hover:to-blue-500/35"
          >
            <Download className="h-4 w-4" />
            {loadingPdf ? "Downloading..." : "Download Executive PDF"}
          </button>
        </div>
      </motion.div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium text-white/90">Gemini Explainability Draft</div>
            <button
              type="button"
              onClick={() => void generateExplainability()}
              disabled={loadingExplain}
              className="inline-flex h-8 items-center rounded-full border border-fuchsia-300/35 bg-fuchsia-500/20 px-3 text-xs text-white"
            >
              {loadingExplain ? "Generating..." : "Generate AI Explainability"}
            </button>
          </div>
          <div className="space-y-4 rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            {riskSummary ? (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wider text-fuchsia-300/90">
                  Risk summary
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{cleanText(riskSummary)}</p>
              </div>
            ) : null}
            {roiImpact ? (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wider text-cyan-300/90">
                  ROI impact
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{cleanText(roiImpact)}</p>
              </div>
            ) : null}
            {riskSummary && roiImpact ? null : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{cleanText(explanation)}</p>
            )}
          </div>
        </motion.article>

        <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-sm font-medium text-white/90">Compliance Score</div>
          <div className="mx-auto h-64 max-w-[280px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                <RadialBarChart
                  innerRadius="65%"
                  outerRadius="100%"
                  barSize={22}
                  data={complianceData}
                  startAngle={210}
                  endAngle={-30}
                >
                  <RadialBar background dataKey="value" cornerRadius={12} />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full animate-pulse rounded-full border border-white/10 bg-white/5" />
            )}
          </div>
          <div className="-mt-6 text-center">
            <div className="text-4xl font-semibold text-cyan-200">{score}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">Enterprise Ready</div>
          </div>
        </motion.article>
      </section>
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 text-sm font-medium text-white/90">Regulatory Compliance</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs uppercase tracking-wider text-white/55">EU AI Act High-Risk Threshold</div>
            <div className="mt-2">
              <Badge className={euAiActPass ? "bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.45)]" : "bg-red-500/20 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.45)]"}>
                {euAiActPass ? "Compliant" : "High Risk"}
              </Badge>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs uppercase tracking-wider text-white/55">NIST AI RMF Guidelines</div>
            <div className="mt-2">
              <Badge className={nistPass ? "bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.45)]" : "bg-red-500/20 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.45)]"}>
                {nistPass ? "Enterprise Ready" : "Gap Detected"}
              </Badge>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.main>
  );
}
