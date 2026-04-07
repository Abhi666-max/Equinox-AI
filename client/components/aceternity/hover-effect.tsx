"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type HoverItem = {
  title: string;
  value: string;
  subtitle?: string;
};

export function HoverEffect({
  items,
  className,
}: {
  items: HoverItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {items.map((item) => (
        <motion.div
          key={item.title}
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-4"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,70,239,0.2),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(34,211,238,0.18),transparent_50%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          <div className="relative z-10">
            <div className="text-xs text-white/60">{item.title}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {item.value}
            </div>
            {item.subtitle ? (
              <div className="mt-2 text-xs text-white/55">{item.subtitle}</div>
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_100px_-70px_rgba(217,70,239,0.95)] opacity-0 transition-opacity duration-200 hover:opacity-100" />
        </motion.div>
      ))}
    </div>
  );
}
