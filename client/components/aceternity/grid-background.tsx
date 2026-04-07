"use client";

import * as React from "react";

export function GridBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(168,85,247,0.2),transparent_45%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.18),transparent_48%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.06),transparent_46%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:50px_50px] opacity-40" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] bg-black/45" />
      </div>
      {children}
    </div>
  );
}
