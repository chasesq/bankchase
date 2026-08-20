"use client";

import React from "react";

export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  // Statsig is optional for this deployment. Render the app without a
  // client-side provider until a valid public Statsig key is configured.
  return <>{children}</>;
}
