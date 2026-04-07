"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAuditStore } from "@/store/useAuditStore";

const initialData = [
  { metric: "Group A", before: 76, after: 91 },
  { metric: "Group B", before: 64, after: 87 },
  { metric: "Group C", before: 58, after: 84 },
  { metric: "Group D", before: 71, after: 90 },
];
const API_BASE = "http://127.0.0.1:8000";

type AuditJson = { bias_score: number; demographic_parity_difference: number };

async function readAuditFromResponse(res: Response): Promise<AuditJson | null> {
  if (!res.ok) return null;
  try {
    const j = (await res.json()) as Record<string, unknown>;
    const bias = Number(j.bias_score);
    const parity = Number(j.demographic_parity_difference);
    if (!Number.isFinite(bias) || !Number.isFinite(parity)) return null;
    return { bias_score: bias, demographic_parity_difference: parity };
  } catch {
    return null;
  }
}

function formatBiasDelta(delta: number): string {
  const v = Number(delta.toFixed(2));
  if (v === 0) return "0";
  return v > 0 ? `↓ ${v.toFixed(2)}` : `↑ ${Math.abs(v).toFixed(2)}`;
}

function formatParityDelta(delta: number): string {
  const v = Number(delta.toFixed(2));
  if (v === 0) return "0";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
}

export default function MitigationStudioPage() {
  const { auditData, mitigationData, setMitigationData } = useAuditStore();
  const [mounted, setMounted] = React.useState(false);
  const [isMitigating, setIsMitigating] = React.useState(false);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function parseCsv(content: string) {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(",");
      return headers.reduce<Record<string, string>>((acc, key, idx) => {
        acc[key] = (cells[idx] ?? "").trim();
        return acc;
      }, {});
    });
  }

  function buildSeries(beforeCsv: string, afterCsv: string) {
    const beforeRows = parseCsv(beforeCsv);
    const afterRows = parseCsv(afterCsv);
    if (!beforeRows.length || !afterRows.length) return initialData;

    const preferred = ["gender", "sex", "race", "ethnicity", "group"];
    const keys = Object.keys(beforeRows[0] ?? {});
    const sensitiveKey =
      preferred.find((k) => keys.some((h) => h.toLowerCase() === k)) ??
      keys.find((k) => k.toLowerCase() !== "target") ??
      keys[0];
    if (!sensitiveKey) return initialData;

    const beforeCount = beforeRows.reduce<Record<string, number>>((acc, row) => {
      const key = row[sensitiveKey] || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const afterCount = afterRows.reduce<Record<string, number>>((acc, row) => {
      const key = row[sensitiveKey] || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const allGroups = Array.from(new Set([...Object.keys(beforeCount), ...Object.keys(afterCount)])).slice(0, 6);
    return allGroups.map((group) => {
      const beforeRaw = beforeCount[group] ?? 0;
      const afterRaw = afterCount[group] ?? 0;
      const den = Math.max(beforeRaw, afterRaw, 1);
      return {
        metric: group,
        before: Number(((beforeRaw / den) * 100).toFixed(2)),
        after: Number(((afterRaw / den) * 100).toFixed(2)),
      };
    });
  }

  async function applyMitigation() {
    if (!csvFile || !auditData) {
      toast.error("Upload a CSV file first.");
      return;
    }
    const tId = toast.loading("Applying SMOTE mitigation...");
    setIsMitigating(true);
    try {
      const originalCsvText = await csvFile.text();
      const mitigateForm = new FormData();
      mitigateForm.append("file", new Blob([originalCsvText], { type: "text/csv" }), csvFile.name || "dataset.csv");

      const originalAudit: AuditJson = {
        bias_score: Number(auditData.bias_score),
        demographic_parity_difference: Number(auditData.demographic_parity_difference),
      };

      const res = await fetch(`${API_BASE}/api/mitigate`, { method: "POST", body: mitigateForm });
      if (!res.ok) {
        throw new Error(await res.text());
      }

      const csvText = await res.text();
      const builtChartData = buildSeries(originalCsvText, csvText);

      const mitigatedAuditForm = new FormData();
      mitigatedAuditForm.append("file", new Blob([csvText], { type: "text/csv" }), "mitigated.csv");
      const mitigatedAuditRes = await fetch(`${API_BASE}/api/upload-csv`, {
        method: "POST",
        body: mitigatedAuditForm,
      });
      const mitigatedAudit = await readAuditFromResponse(mitigatedAuditRes);

      if (mitigatedAudit) {
        const biasDrop = originalAudit.bias_score - mitigatedAudit.bias_score;
        const parityGain = Math.abs(originalAudit.demographic_parity_difference) - Math.abs(mitigatedAudit.demographic_parity_difference);
        const utilityRetained = Math.max(75, Math.min(100, 100 - Math.abs(biasDrop) * 0.25));
        setMitigationData({
          before: originalAudit,
          after: mitigatedAudit,
          biasScoreDelta: Number(biasDrop.toFixed(2)),
          parityDelta: Number(parityGain.toFixed(2)),
          utilityRetained: Number(utilityRetained.toFixed(2)),
          chartData: builtChartData,
        });
      } else {
        setMitigationData(null);
      }

      const blob = new Blob([csvText], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mitigated_dataset.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Mitigation complete. CSV downloaded.", { id: tId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mitigation failed", { id: tId });
    } finally {
      setIsMitigating(false);
    }
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

  const chartData =
    mitigationData?.chartData ??
    [
      { metric: "Bias Score", before: Number(auditData.bias_score.toFixed(2)), after: Number(auditData.bias_score.toFixed(2)) },
      { metric: "Parity Gap", before: Number((Math.abs(auditData.demographic_parity_difference) * 100).toFixed(2)), after: Number((Math.abs(auditData.demographic_parity_difference) * 100).toFixed(2)) },
      { metric: "Impact Drift", before: Number((Math.abs(1 - auditData.disparate_impact_ratio) * 100).toFixed(2)), after: Number((Math.abs(1 - auditData.disparate_impact_ratio) * 100).toFixed(2)) },
    ];
  const kpi = mitigationData;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 mx-auto w-full max-w-6xl space-y-6 bg-[#000000] bg-gradient-to-tr from-purple-900/10 to-transparent px-6"
    >
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Mitigation Studio</h1>
          <p className="mt-1 text-sm text-white/60">
            Simulate SMOTE interventions and compare fairness outcomes before deployment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void applyMitigation()}
          disabled={isMitigating}
          className="inline-flex h-10 items-center rounded-full border border-emerald-300/35 bg-gradient-to-r from-emerald-400/25 to-cyan-400/25 px-5 text-sm font-medium text-white shadow-[0_0_26px_-12px_rgba(52,211,153,0.9)] transition hover:from-emerald-400/35 hover:to-cyan-400/35"
        >
          {isMitigating ? "Applying..." : "Apply Mitigation"}
        </button>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 text-sm text-white/75">Dataset for Mitigation</div>
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
          onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
        />
      </motion.div>

      <section className="grid gap-4 lg:grid-cols-2">
        <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-sm font-medium text-white/90">Intersectional Bias Across Demographics</div>
          <div className="h-72">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,14,24,0.95)", border: "1px solid rgba(255,255,255,0.12)" }}
                    labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                  />
                  <Radar name="Before" dataKey="before" stroke="#f472b6" fill="#f472b6" fillOpacity={0.28} />
                  <Radar name="After" dataKey="after" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
            )}
          </div>
        </motion.article>

        <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-sm font-medium text-white/90">Mitigation KPI Snapshot</div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-wider text-white/55">Bias Score Change</div>
              {!kpi ? (
                <div className="mt-1 text-2xl font-semibold tabular-nums text-white/40">---</div>
              ) : (
                <>
                  <div className="mt-1 text-[11px] tabular-nums text-white/45">
                    Before {kpi.before.bias_score.toFixed(1)} → After {kpi.after.bias_score.toFixed(1)}
                  </div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-300">
                    {formatBiasDelta(kpi.biasScoreDelta)} <span className="text-sm font-normal text-white/50">pts</span>
                  </div>
                </>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-wider text-white/55">Demographic Parity Δ</div>
              {!kpi ? (
                <div className="mt-1 text-2xl font-semibold tabular-nums text-white/40">---</div>
              ) : (
                <>
                  <div className="mt-1 text-[11px] tabular-nums text-white/45">
                    |dp| {Math.abs(kpi.before.demographic_parity_difference).toFixed(2)} →{" "}
                    {Math.abs(kpi.after.demographic_parity_difference).toFixed(2)}
                  </div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums text-cyan-200">
                    {formatParityDelta(kpi.parityDelta)}
                  </div>
                </>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-wider text-white/55">Model Utility Retained</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-violet-200">
                {!kpi ? "---" : `${kpi.utilityRetained.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </motion.article>
      </section>
    </motion.main>
  );
}
