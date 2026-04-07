"use client";

import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative z-10 mx-auto w-full max-w-6xl space-y-6 px-6"
    >
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-white/60">Configure integrations and workspace preferences.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/90">API Keys</h2>
          <p className="mt-1 text-xs text-white/55">Gemini integration and secure runtime configuration.</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
            Gemini API Key is securely managed via server environment variables.
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-xl">
          <h2 className="text-sm font-medium text-white/90">Theme Preferences</h2>
          <p className="mt-1 text-xs text-white/55">Choose how your console appears across sessions.</p>
          <div className="mt-4 space-y-3">
            <label className="block text-xs uppercase tracking-wider text-white/50" htmlFor="theme-select">
              Theme
            </label>
            <select
              id="theme-select"
              defaultValue="dark"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none focus:border-cyan-300/40"
            >
              <option value="dark">Dark (Recommended)</option>
              <option value="system">System</option>
              <option value="light">Light</option>
            </select>
            <div className="text-xs text-white/50">Preference sync and advanced palettes can be added here.</div>
          </div>
        </article>
      </section>
    </motion.main>
  );
}
