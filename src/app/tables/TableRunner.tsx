"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTime } from "@/lib/disciplines";
import type { TableRound } from "@/lib/tables";
import { useTone } from "./useTone";
import { useWakeLock } from "./useWakeLock";

type Phase = {
  kind: "breathe" | "hold";
  seconds: number;
  roundIndex: number;
  /** Hold phases only: open hold counts up with no auto-end. */
  open?: boolean;
  /** Hold phases only: optional soft target marker (seconds). */
  targetSec?: number;
};

/** Flatten CO2 rounds into a phase list: breathe-up before each hold, then the hold. */
function buildPhases(rounds: TableRound[]): Phase[] {
  const phases: Phase[] = [];
  rounds.forEach((r, i) => {
    phases.push({ kind: "breathe", seconds: r.breatheSec, roundIndex: i });
    phases.push({
      kind: "hold",
      seconds: r.holdSec,
      roundIndex: i,
      open: r.open,
      targetSec: r.targetSec,
    });
  });
  return phases;
}

export type RunResult = {
  completedRounds: number;
  maxHoldSec: number;
};

export function TableRunner({
  rounds,
  onComplete,
}: {
  rounds: TableRound[];
  onComplete: (result: RunResult) => void;
}) {
  const phases = useMemo(() => buildPhases(rounds), [rounds]);
  const totalHolds = rounds.length;

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  // For timed phases this counts DOWN (seconds remaining); for open holds it
  // counts UP (seconds elapsed) and never auto-advances.
  const [remaining, setRemaining] = useState(phases[0]?.seconds ?? 0);
  const [elapsed, setElapsed] = useState(0);
  const [finalResult, setFinalResult] = useState<RunResult | null>(null);

  const { unlock, cueTick, cueHoldStart, cuePhaseStart, cueTarget, cueFinish } = useTone();
  const wakeLock = useWakeLock();

  const completedHoldsRef = useRef(0);
  const maxHoldRef = useRef(0);
  const targetCuedRef = useRef(false);

  const phase = phases[phaseIdx];
  const isOpenHold = phase?.kind === "hold" && phase.open === true;

  const stop = useCallback(
    (complete: boolean) => {
      setFinished(true);
      setPaused(false);
      void wakeLock.release();
      if (complete) cueFinish();
      const result = {
        completedRounds: completedHoldsRef.current,
        maxHoldSec: maxHoldRef.current,
      };
      setFinalResult(result);
      onComplete(result);
    },
    [wakeLock, cueFinish, onComplete],
  );

  /** Move to the next phase, recording an actual hold duration if one just ended. */
  const advance = useCallback(
    (heldSeconds: number | null) => {
      const cur = phases[phaseIdx];
      if (cur.kind === "hold") {
        completedHoldsRef.current += 1;
        const actual = heldSeconds ?? cur.seconds;
        if (actual > maxHoldRef.current) maxHoldRef.current = actual;
      }

      const nextIdx = phaseIdx + 1;
      if (nextIdx >= phases.length) {
        stop(true);
        return;
      }
      const next = phases[nextIdx];
      if (next.kind === "hold") cueHoldStart();
      else cuePhaseStart();
      targetCuedRef.current = false;
      setPhaseIdx(nextIdx);
      setElapsed(0);
      setRemaining(next.seconds);
    },
    [phaseIdx, phases, cueHoldStart, cuePhaseStart, stop],
  );

  /** End an open hold via the "Done" button, recording the elapsed time. */
  const endOpenHold = useCallback(() => {
    advance(elapsed);
  }, [advance, elapsed]);

  const start = useCallback(() => {
    unlock();
    void wakeLock.request();
    setStarted(true);
    cuePhaseStart();
  }, [unlock, wakeLock, cuePhaseStart]);

  // 1-second tick. Timed phases count down and auto-advance; open holds count
  // up and wait for the diver to tap "Done".
  useEffect(() => {
    if (!started || finished || paused) return;
    const cur = phases[phaseIdx];

    if (cur?.kind === "hold" && cur.open) {
      const id = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          if (cur.targetSec && next >= cur.targetSec && !targetCuedRef.current) {
            targetCuedRef.current = true;
            cueTarget();
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(id);
    }

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) {
          if (r <= 4) cueTick(); // final 3s countdown (ticks at 3,2,1)
          return r - 1;
        }
        advance(null);
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, finished, paused, phaseIdx, phases, cueTick, cueTarget, advance]);

  if (!started) {
    return (
      <div className="text-center">
        <p className="mb-4 text-foam-200/70">
          {totalHolds} holds · tap start, then keep the screen on.
        </p>
        <button
          onClick={start}
          className="w-full rounded-xl bg-current-400 px-4 py-4 text-lg font-semibold text-abyss-950 transition hover:bg-current-300"
        >
          Start table
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="text-center">
        <div className="text-5xl font-bold text-current-300">✓</div>
        <p className="mt-3 text-lg font-medium text-foam-100">
          {finalResult?.completedRounds ?? 0} / {totalHolds} holds done
        </p>
        <p className="mt-1 text-foam-200/60">
          Longest hold {formatTime(finalResult?.maxHoldSec ?? 0)}
        </p>
      </div>
    );
  }

  const isHold = phase.kind === "hold";
  const roundLabel = `Round ${phase.roundIndex + 1} / ${totalHolds}`;

  return (
    <div
      className={
        "rounded-2xl p-6 text-center transition-colors " +
        (isHold ? "bg-deep-600/30 ring-1 ring-current-300/30" : "bg-abyss-800/40")
      }
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-foam-200/60">
        {roundLabel}
      </p>
      <p
        className={
          "mt-1 text-xl font-semibold " +
          (isHold ? "text-current-300" : "text-foam-200")
        }
      >
        {isHold ? (isOpenHold ? "HOLD — go as long as you can" : "HOLD") : "Breathe up"}
      </p>
      <div className="my-2 text-7xl font-bold tabular-nums tracking-tight text-foam-100">
        {formatTime(isOpenHold ? elapsed : remaining)}
      </div>
      {isOpenHold && phase.targetSec ? (
        <p className="text-sm text-foam-200/55">
          target {formatTime(phase.targetSec)}
        </p>
      ) : null}

      {isOpenHold ? (
        <div className="mt-4 flex flex-col gap-3">
          <button
            onClick={endOpenHold}
            className="w-full rounded-xl bg-current-400 px-4 py-4 text-lg font-semibold text-abyss-950 transition hover:bg-current-300"
          >
            Done — I stopped
          </button>
          <button
            onClick={() => stop(false)}
            className="rounded-xl border border-coral-400/25 px-4 py-3 font-medium text-coral-300 transition hover:bg-coral-400/10"
          >
            Stop table
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex-1 rounded-xl border border-current-300/25 px-4 py-3 font-medium text-foam-100 transition hover:bg-surface-raised/60"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => stop(false)}
            className="flex-1 rounded-xl border border-coral-400/25 px-4 py-3 font-medium text-coral-300 transition hover:bg-coral-400/10"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
