"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-[20%] -top-[10%] h-[min(90vw,720px)] w-[min(90vw,720px)] rounded-full bg-fuchsia-600/15 blur-[100px]"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, 30, -15, 0],
            scale: [1, 1.05, 0.98, 1],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[15%] -right-[15%] h-[min(85vw,680px)] w-[min(85vw,680px)] rounded-full bg-cyan-500/12 blur-[100px]"
          animate={{
            x: [0, -35, 25, 0],
            y: [0, -25, 20, 0],
            scale: [1, 1.08, 0.97, 1],
          }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,80,200,0.18),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(34,211,238,0.12),transparent_50%),linear-gradient(to_bottom,#000000,#050508_50%,#000000)]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Enterprise AI governance · Fairlearn + Gemini
          </div>

          <h1 className="mt-8 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
            <span className="bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent">
              Ensure AI Fairness with Mathematical Certainty.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Equinox AI provides enterprise-grade bias detection, automated SMOTE mitigation, and
            Gemini-powered explainability.
          </p>

          <div className="mt-10">
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-10 py-5 text-lg font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_60px_-15px_rgba(34,211,238,0.45),0_25px_80px_-30px_rgba(168,85,247,0.5)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_80px_-10px_rgba(34,211,238,0.55)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/30 via-cyan-500/25 to-violet-500/30 opacity-90 transition group-hover:opacity-100" />
              <span className="absolute inset-[1px] rounded-[15px] bg-black/40 backdrop-blur-sm" />
              <span className="relative flex items-center gap-2">
                Launch Audit Console
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </motion.div>

        <footer className="mt-auto pt-24 text-center text-sm text-zinc-600">
          Architected by Abhijeet Kangane
        </footer>
      </main>
    </div>
  );
}
