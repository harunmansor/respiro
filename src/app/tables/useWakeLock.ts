"use client";

import { useCallback, useEffect, useRef } from "react";

type WakeLockSentinelLike = { release: () => Promise<void> };

/**
 * Keeps the screen awake during a table run so locked-screen audio cues don't
 * cut out. No-op where the Wake Lock API is unavailable (e.g. iOS < 16.4).
 */
export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinelLike | null>(null);
  const wantedRef = useRef(false);

  const request = useCallback(async () => {
    wantedRef.current = true;
    const wl = (navigator as unknown as {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    }).wakeLock;
    if (!wl) return;
    try {
      lockRef.current = await wl.request("screen");
    } catch {
      // Denied or not allowed — fail silently.
    }
  }, []);

  const release = useCallback(async () => {
    wantedRef.current = false;
    try {
      await lockRef.current?.release();
    } catch {
      // ignore
    }
    lockRef.current = null;
  }, []);

  // Re-acquire the lock when returning to the tab if a run is still active.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && wantedRef.current) {
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lockRef.current?.release().catch(() => {});
    };
  }, [request]);

  return { request, release };
}
