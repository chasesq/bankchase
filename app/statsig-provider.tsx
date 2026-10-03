"use client";

import React, { useMemo } from "react";
import { useClientAsyncInit, StatsigProvider } from "@statsig/react-bindings";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";

const STATSIG_CLIENT_KEY =
  process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ??
  "client-vSoUwyRPWejywb87YnUl2g7t8iSe5I3716PkJgjvGQv";

const STATSIG_USER_ID = process.env.NEXT_PUBLIC_STATSIG_USER_ID ?? "anonymous-user";
const STATSIG_ACCOUNT_ID = process.env.NEXT_PUBLIC_STATSIG_ACCOUNT_ID;

export default function StatsigWrapper({ children }: { children: React.ReactNode }) {
  const user = useMemo(
    () => ({
      userID: STATSIG_USER_ID,
      ...(STATSIG_ACCOUNT_ID
        ? { customIDs: { accountID: STATSIG_ACCOUNT_ID } }
        : {}),
    }),
    [],
  );

  const options = useMemo(() => {
    // Preview embeds are cross-origin iframes. Analytics plugins may inspect
    // the parent frame and trigger a browser SecurityError there, so only
    // install them when this app is running in its top-level window.
    const isTopLevelWindow =
      typeof window !== "undefined" && window.self === window.top;

    return isTopLevelWindow
      ? {
          plugins: [new StatsigAutoCapturePlugin(), new StatsigSessionReplayPlugin()],
        }
      : {};
  }, []);

  const { client } = useClientAsyncInit(STATSIG_CLIENT_KEY, user, options);

  return (
    <StatsigProvider client={client} loadingComponent={null}>
      {children}
    </StatsigProvider>
  );
}
