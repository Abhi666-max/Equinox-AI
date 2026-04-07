"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, FileText, FlaskConical, Home, Search, Settings, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuditStore } from "@/store/useAuditStore";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "Mitigation Studio", href: "/dashboard/mitigation-studio", icon: FlaskConical },
  { label: "LLM Auditor", href: "/dashboard/llm-auditor", icon: Bot },
  { label: "Explainability & ROI", href: "/dashboard/reports", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useAuditStore();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const s = useAuditStore.getState();
        s.setSearchOpen(!s.isSearchOpen);
      }
      if (e.key === "Escape") useAuditStore.getState().setSearchOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden overflow-x-hidden bg-[#000000]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-28 -top-24 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/20 blur-3xl"
          animate={{ x: [0, 34, -10, 0], y: [0, 20, -8, 0], opacity: [0.4, 0.55, 0.4] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-28 -right-24 h-[34rem] w-[34rem] rounded-full bg-cyan-500/20 blur-3xl"
          animate={{ x: [0, -26, 8, 0], y: [0, -24, 12, 0], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.18),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.14),transparent_45%),linear-gradient(to_bottom,#000000,#03050d)]" />
      </div>
      <aside className="z-10 w-64 shrink-0 border-r border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <div className="text-sm tracking-widest text-white/90">EQUINOX AI</div>
              <div className="text-xs text-white/55">Audit Console</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "border-cyan-300/30 bg-cyan-500/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.3)]"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
            Enterprise-grade bias auditing workspace. Upload datasets, run audits,
            and generate explainability reports.
          </div>

          <div className="mt-auto pt-6">
            <div className="founder-border-glow rounded-2xl p-[1px]">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                className="founder-premium flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#050508] px-3 py-2.5 backdrop-blur-xl"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/70 opacity-80" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-sm font-medium tracking-wide text-white/90">Abhijeet Kangane</div>
                    <div className="text-[11px] text-white/45">Founder</div>
                  </div>
                </div>
                <div className="founder-avatar-pulse flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/35 bg-gradient-to-br from-white/10 to-white/5 text-xs font-semibold text-white/90 shadow-[0_0_18px_rgba(34,211,238,0.45)]">
                  AK
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <div className="flex items-center justify-end border-b border-white/5 bg-white/[0.02] px-4 py-2">
          <button
            type="button"
            onClick={() => {
              const s = useAuditStore.getState();
              s.setSearchOpen(!s.isSearchOpen);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 text-xs text-white/70 transition hover:bg-white/[0.08]"
          >
            <Search className="h-3.5 w-3.5" />
            Search — Ctrl+K
          </button>
        </div>
        <section className="relative z-10 min-w-0 max-w-full overflow-x-hidden p-4">{children}</section>

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              onClick={() => setSearchOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-white/50" />
                  <input
                    autoFocus
                    type="search"
                    placeholder="Search Equinox AI…"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-white/45">Quick actions</p>
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/[0.08]"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push("/dashboard/mitigation-studio");
                      }}
                    >
                      → Go to Mitigation Studio
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/[0.08]"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push("/dashboard/reports");
                      }}
                    >
                      → Generate PDF Report
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/[0.08]"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push("/dashboard");
                      }}
                    >
                      → Overview
                    </button>
                  </li>
                </ul>
                <p className="mt-3 border-t border-white/10 pt-3 text-center text-[11px] text-white/40">
                  Press <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5">Esc</kbd> to close
                </p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
