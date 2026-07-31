"use client";

import { useState } from "react";
import { formatTime } from "@/lib/disciplines";
import type { TableRound } from "@/lib/tables";

const MAX_DURATION = 60 * 60;

function clampSeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_DURATION, Math.max(0, Math.round(value)));
}

function TimeInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (seconds: number) => void;
  label: string;
}) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return (
    <fieldset>
      <legend className="mb-1 text-[11px] font-medium text-foam-200/55">{label}</legend>
      <div className="flex items-center gap-1.5">
        <label className="sr-only">{label} minutes</label>
        <input
          type="number"
          min={0}
          max={60}
          inputMode="numeric"
          value={minutes}
          onChange={(e) => onChange(clampSeconds(Number(e.target.value) * 60 + seconds))}
          className="w-14 rounded-lg border border-current-300/15 bg-abyss-950/45 px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-current-300/60"
        />
        <span className="text-xs text-foam-200/45">m</span>
        <input
          type="number"
          min={0}
          max={59}
          inputMode="numeric"
          value={seconds}
          onChange={(e) => onChange(clampSeconds(minutes * 60 + Math.min(59, Number(e.target.value))))}
          className="w-14 rounded-lg border border-current-300/15 bg-abyss-950/45 px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-current-300/60"
        />
        <span className="text-xs text-foam-200/45">s</span>
      </div>
    </fieldset>
  );
}

export function makeCustomRounds(count = 8, open = false, holdSec = 60, breatheSec = 30): TableRound[] {
  return Array.from({ length: count }, () => ({
    holdSec: open ? 0 : holdSec,
    breatheSec,
    ...(open ? { open: true } : {}),
  }));
}

export function CustomTableEditor({
  rounds,
  onChange,
}: {
  rounds: TableRound[];
  onChange: (rounds: TableRound[]) => void;
}) {
  const [count, setCount] = useState(rounds.length);
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [defaultHold, setDefaultHold] = useState(60);
  const [defaultBreathe, setDefaultBreathe] = useState(30);

  function replace(index: number, patch: Partial<TableRound>) {
    onChange(rounds.map((round, i) => (i === index ? { ...round, ...patch } : round)));
  }

  function generate() {
    onChange(makeCustomRounds(count, defaultOpen, defaultHold, defaultBreathe));
  }

  function duplicate(index: number) {
    if (rounds.length >= 30) return;
    const next = [...rounds];
    next.splice(index + 1, 0, { ...rounds[index] });
    onChange(next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rounds.length) return;
    const next = [...rounds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="mb-5">
      <section className="rounded-xl border border-current-300/12 bg-abyss-950/25 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-foam-200/50">Quick setup</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1 block text-[11px] font-medium text-foam-200/55">Rounds</span>
            <input
              type="number"
              min={1}
              max={30}
              value={count}
              onChange={(e) => setCount(Math.min(30, Math.max(1, Number(e.target.value))))}
              className="w-full rounded-lg border border-current-300/15 bg-abyss-950/45 px-3 py-2 text-sm outline-none focus:border-current-300/60"
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] font-medium text-foam-200/55">Hold type</span>
            <select
              value={defaultOpen ? "open" : "timed"}
              onChange={(e) => setDefaultOpen(e.target.value === "open")}
              className="w-full rounded-lg border border-current-300/15 bg-abyss-950/45 px-3 py-2 text-sm outline-none focus:border-current-300/60"
            >
              <option value="timed">Timed</option>
              <option value="open">Max / open</option>
            </select>
          </label>
          {!defaultOpen && <TimeInput value={defaultHold} onChange={setDefaultHold} label="Default hold" />}
          <TimeInput value={defaultBreathe} onChange={setDefaultBreathe} label="Breathe before hold" />
        </div>
        <button type="button" onClick={generate} className="mt-3 w-full rounded-lg border border-current-300/20 px-3 py-2 text-sm font-medium text-current-300 hover:bg-current-400/10">
          Generate rounds
        </button>
      </section>

      <div className="mt-4 flex flex-col gap-2.5">
        {rounds.map((round, index) => (
          <section key={index} className="rounded-xl border border-current-300/12 bg-abyss-900/35 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-current-300">Round {index + 1}</span>
                <p className="mt-0.5 text-xs text-foam-200/45">
                  Breathe {formatTime(round.breatheSec)} → {round.open ? `Hold max${round.targetSec ? ` · target ${formatTime(round.targetSec)}` : ""}` : `Hold ${formatTime(round.holdSec)}`}
                </p>
              </div>
              <select
                value={round.open ? "open" : "timed"}
                aria-label={`Round ${index + 1} hold type`}
                onChange={(e) => {
                  const open = e.target.value === "open";
                  replace(index, open ? { open: true, holdSec: 0 } : { open: false, holdSec: round.holdSec || 60, targetSec: undefined });
                }}
                className="rounded-lg border border-current-300/15 bg-abyss-950/50 px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="timed">Timed</option>
                <option value="open">Max / open</option>
              </select>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TimeInput value={round.breatheSec} onChange={(value) => replace(index, { breatheSec: value })} label="Breathe before hold" />
              {round.open ? (
                <TimeInput value={round.targetSec ?? 0} onChange={(value) => replace(index, { targetSec: value || undefined })} label="Optional target (0 = none)" />
              ) : (
                <TimeInput value={round.holdSec} onChange={(value) => replace(index, { holdSec: value })} label="Hold duration" />
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 border-t border-current-300/8 pt-2.5 text-xs text-foam-200/55">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="disabled:opacity-25">↑ Up</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === rounds.length - 1} className="disabled:opacity-25">↓ Down</button>
              <button type="button" onClick={() => duplicate(index)} disabled={rounds.length >= 30} className="disabled:opacity-25">Duplicate</button>
              <button type="button" onClick={() => onChange(rounds.filter((_, i) => i !== index))} disabled={rounds.length <= 1} className="ml-auto text-coral-300 disabled:opacity-25">Remove</button>
            </div>
          </section>
        ))}
      </div>
      <button
        type="button"
        disabled={rounds.length >= 30}
        onClick={() => onChange([...rounds, { holdSec: 60, breatheSec: 30 }])}
        className="mt-3 w-full rounded-xl border border-dashed border-current-300/25 px-3 py-3 text-sm font-medium text-current-300 disabled:opacity-40"
      >
        + Add round
      </button>
    </div>
  );
}
