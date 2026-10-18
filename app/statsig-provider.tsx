"use client";

import type React from "react";

/**
 * Keep the app tree independent from browser analytics initialization.
 *
 * The v0 preview renders the app inside a cross-origin frame. Statsig's
 * browser plugins inspect Location/Window across that boundary and can throw
 * a SecurityError during Next.js HMR, which then surfaces as a router error.
 * Analytics can be mounted by the host in a top-level production page without
 * making the application render depend on cross-origin frame access.
 */
export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
