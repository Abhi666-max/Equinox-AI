"use client";

import * as React from "react";
import { animate, motion } from "framer-motion";
import { toast } from "sonner";

import { Vortex } from "@/components/aceternity/vortex";

type LlmAuditSuccess = {
  success: true;
  implicit_bias_probability: number;
  reasoning: string;
};

const API_BASE = "https://equinox-backend-y77g.onrender.com";

export default function LlmAuditorPage() {
  const [text, setText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<LlmAuditSuccess | null>(null);
  const [displayPct, setDisplayPct] = React.useState(0);
  const prevPctRef = React.useRef(0);

  React.useEffect(() => {
    if (result == null) {
      prevPctRef.current = 0;
      setDisplayPct(0);
      return;
    }
    const from = prevPctRef.current;
    const to = result.implicit_bias_probability;
    prevPctRef.current = to;
    const controls = animate(from, to, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayPct(v),
    });
    return () => controls.stop();
  }, [result]);

  async function runAudit() {
    if (text.trim().length < 10) {
      toast.error("Please enter at least 10 characters.");
      return;
    }
    setResult(null);
    const tId = toast.loading("Running Gemini prompt audit...");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/llm-audit-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      const body = (data ?? {}) as Record<string, unknown>;
      const prob = body.implicit_bias_probability;
      const reasoning = body.reasoning;
      if (typeof prob === "number" && typeof reasoning === "string") {
        setResult({
          success: true,
          implicit_bias_probability: prob,
          reasoning,
        });
      }
      toast.success("Implicit bias audit complete.", { id: tId });
    } catch {
      toast.dismiss(tId);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 mx-auto w-full max-w-6xl space-y-6 px-6"
    >
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">LLM Auditor</h1>
        <p className="mt-1 text-sm text-white/60">
          Detect implicit bias in prompts using Gemini-powered semantic analysis.
        </p>
      </div>

      <Vortex className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-2xl backdrop-blur-xl">
        <label htmlFor="audit-text" className="mb-2 block text-sm text-white/75">
          Prompt Content
        </label>
        <textarea
          id="audit-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an LLM prompt or user-facing model instruction..."
          className="h-56 w-full resize-none rounded-xl border border-white/15 bg-black/45 p-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/45"
        />
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void runAudit()}
            disabled={isLoading}
            className="inline-flex h-10 items-center rounded-full border border-cyan-300/35 bg-gradient-to-r from-cyan-400/25 to-blue-500/25 px-5 text-sm font-medium text-white transition hover:from-cyan-400/35 hover:to-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Auditing..." : "Run LLM Audit"}
          </button>
        </div>
      </Vortex>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
        <div className="text-sm text-white/70">Implicit Bias Probability</div>
        <div className="mt-2 text-4xl font-semibold tabular-nums text-cyan-200">
          {`${displayPct.toFixed(1)}%`}
        </div>
        <div
          className={`equinox-progress-track relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10 ${isLoading ? "equinox-shimmer-active" : ""}`}
        >
          <div
            className="relative z-[1] h-full rounded-full bg-gradient-to-r from-cyan-400/90 to-blue-500/85"
            style={{ width: `${displayPct}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          {result?.reasoning ?? "Run an audit to receive a qualitative risk explanation."}
        </p>
      </section>
    </motion.main>
  );
}
