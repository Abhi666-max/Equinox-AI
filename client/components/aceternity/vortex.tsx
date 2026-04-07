"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type VortexProps = {
  className?: string;
  children: React.ReactNode;
};

export function Vortex({ className, children }: VortexProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-black/30", className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,auto,36px_36px,36px_36px] opacity-70" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
