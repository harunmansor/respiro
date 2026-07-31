"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Generated audio cues via the Web Audio API — no assets, works offline.
 * iOS requires the AudioContext to be created/resumed from a user gesture, so
 * `unlock()` must be called from a click/tap (e.g. the Start button).
 */
export function useTone() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    return ctxRef.current;
  }, []);

  /** Call from a user gesture to satisfy autoplay policies (esp. iOS). */
  const unlock = useCallback(() => {
    const ctx = ensureCtx();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }, [ensureCtx]);

  const beep = useCallback(
    (freq: number, durationMs: number, gain = 0.2) => {
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") void ctx.resume();

      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      const now = ctx.currentTime;
      const dur = durationMs / 1000;
      // Short attack/release to avoid clicks.
      amp.gain.setValueAtTime(0, now);
      amp.gain.linearRampToValueAtTime(gain, now + 0.01);
      amp.gain.setValueAtTime(gain, now + dur - 0.03);
      amp.gain.linearRampToValueAtTime(0, now + dur);

      osc.connect(amp).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    },
    [ensureCtx],
  );

  // Semantic cues used by the runner.
  const cueTick = useCallback(() => beep(880, 120, 0.15), [beep]); // countdown tick
  const cuePhaseStart = useCallback(() => beep(660, 350, 0.25), [beep]); // entering a phase
  const cueHoldStart = useCallback(() => beep(523, 450, 0.28), [beep]); // breathe-up -> hold
  const cueTarget = useCallback(() => {
    // Reaching a soft target during an open hold — two soft mid notes.
    beep(698, 160, 0.22);
    setTimeout(() => beep(698, 160, 0.22), 200);
  }, [beep]);
  const cueFinish = useCallback(() => {
    beep(523, 200);
    setTimeout(() => beep(659, 200), 210);
    setTimeout(() => beep(784, 400), 420);
  }, [beep]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return { unlock, cueTick, cuePhaseStart, cueHoldStart, cueTarget, cueFinish };
}
