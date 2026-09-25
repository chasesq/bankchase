"use client";

import React from "react";
import { useClientAsyncInit, StatsigProvider } from "@statsig/react-bindings";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";

const STATSIG_CLIENT_KEY =
  process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ??
  "client-vSoUwyRPWejywb87YnUl2g7t8iSe5I3716PkJgjvGQv";

const STATSIG_USER_ID = process.env.NEXT_PUBLIC_STATSIG_USER_ID ?? "anonymous-user";
const STATSIG_ACCOUNT_ID = process.env.NEXT_PUBLIC_STATSIG_ACCOUNT_ID;

export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  const user = {
    userID: STATSIG_USER_ID,
    ...(STATSIG_ACCOUNT_ID
      ? { customIDs: { accountID: STATSIG_ACCOUNT_ID } }
      : {}),
  };

  const { client } = useClientAsyncInit(
    STATSIG_CLIENT_KEY,
    user,
    {
      plugins: [new StatsigAutoCapturePlugin(), new StatsigSessionReplayPlugin()],
    },
  );

  return (
    <StatsigProvider client={client} loadingComponent={null}>
      {children}
    </StatsigProvider>
  );
}
