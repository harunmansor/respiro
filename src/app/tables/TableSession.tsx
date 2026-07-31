"use client";

import { useMemo, useState } from "react";
import {
  generateCO2Table,
  generateCoachUTable,
  isValidRounds,
  totalTableSeconds,
  type TableRound,
} from "@/lib/tables";
import { formatTime } from "@/lib/disciplines";
import { TableRunner, type RunResult } from "./TableRunner";
import { saveTableRun, saveTemplate } from "./actions";
import { CustomTableEditor, makeCustomRounds } from "./CustomTableEditor";

const ROUND_OPTIONS = [6, 8, 10, 12];

type Mode = "auto" | "coach" | "custom";

export function TableSession({
  pbSeconds,
  initialRounds,
  templateId,
  templateName,
}: {
  pbSeconds: number;
  /** When set, run this exact table (a saved template) instead of generating one. */
  initialRounds?: TableRound[];
  templateId?: string;
  templateName?: string;
}) {
  const isTemplate = initialRounds != null;

  const [mode, setMode] = useState<Mode>("auto");
  const [rounds, setRounds] = useState(8);
  const [customRounds, setCustomRounds] = useState<TableRound[]>(() => makeCustomRounds());
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "done" | "error">("idle");

  const [name, setName] = useState("");
  const [tmplSave, setTmplSave] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [tmplError, setTmplError] = useState<string | null>(null);

  const table = useMemo(
    () =>
      isTemplate
        ? initialRounds
        : mode === "coach"
          ? generateCoachUTable({ rounds })
          : mode === "custom"
            ? customRounds
          : generateCO2Table({ pbSeconds, rounds }),
    [isTemplate, initialRounds, mode, pbSeconds, rounds, customRounds],
  );
  const total = totalTableSeconds(table);
  const tableIsValid = isValidRounds(table);

  async function handleComplete(result: RunResult) {
    setSaved("saving");
    const res = await saveTableRun({
      rounds: table,
      completedRounds: result.completedRounds,
      maxHoldSec: result.maxHoldSec || null,
      templateId: templateId ?? null,
    });
    setSaved(res.ok ? "done" : "error");
  }

  async function handleSaveTemplate() {
    setTmplSave("saving");
    setTmplError(null);
    const res = await saveTemplate({
      name,
      rounds: table,
      basedOnPBSeconds: mode === "auto" ? pbSeconds : null,
    });
    if (res.ok) {
      setTmplSave("done");
      setName("");
    } else {
      setTmplSave("error");
      setTmplError(res.error ?? "Couldn’t save.");
    }
  }

  if (running) {
    return (
      <div>
        <TableRunner rounds={table} onComplete={handleComplete} />
        {saved === "saving" && (
          <p className="mt-4 text-center text-sm text-foam-200/60">Saving run…</p>
        )}
        {saved === "done" && (
          <p className="mt-4 text-center text-sm text-current-300">
            Run saved to history.
          </p>
        )}
        {saved === "error" && (
          <p className="mt-4 text-center text-sm text-coral-300">
            Couldn’t save the run.
          </p>
        )}
        {saved !== "idle" && saved !== "saving" && (
          <button
            onClick={() => {
              setRunning(false);
              setSaved("idle");
            }}
            className="mt-3 w-full rounded-xl border border-current-300/25 px-4 py-3 font-medium text-foam-100 transition hover:bg-surface-raised/60"
          >
            Back to table
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {isTemplate ? (
        <p className="mb-4 text-sm font-medium text-foam-100">
          {templateName ?? "Saved table"}
        </p>
      ) : (
        <>
          <div className="mb-4">
            <span className="text-sm font-medium text-foam-200/90">Table</span>
            <div className="mt-2 flex gap-2">
              {([
                { id: "auto", label: "Auto (PB)" },
                { id: "coach", label: "Coach U-table" },
                { id: "custom", label: "Custom" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition " +
                    (m.id === mode
                      ? "bg-current-400 text-abyss-950"
                      : "border border-current-300/20 text-foam-200/80 hover:bg-surface-raised/60")
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode !== "custom" && <div className="mb-4">
            <span className="text-sm font-medium text-foam-200/90">Rounds</span>
            <div className="mt-2 flex gap-2">
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRounds(n)}
                  className={
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition " +
                    (n === rounds
                      ? "bg-current-400 text-abyss-950"
                      : "border border-current-300/20 text-foam-200/80 hover:bg-surface-raised/60")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>}

          {mode === "custom" && (
            <CustomTableEditor rounds={customRounds} onChange={setCustomRounds} />
          )}
        </>
      )}

      <ol className="mb-4 divide-y divide-current-300/10 overflow-hidden rounded-xl border border-current-300/10">
        {table.map((r, i) => (
          <li
            key={i}
            className="flex items-center justify-between bg-abyss-900/30 px-3.5 py-2 text-sm"
          >
            <span className="text-foam-200/60">Round {i + 1}</span>
            <span className="text-foam-100">
              hold{" "}
              {r.open ? (
                <span className="font-semibold">
                  {r.targetSec ? `~${formatTime(r.targetSec)}` : "max"}
                </span>
              ) : (
                <span className="font-semibold">{formatTime(r.holdSec)}</span>
              )}
              <span className="px-2 text-foam-200/40">·</span>
              breathe{" "}
              <span className="font-semibold">{formatTime(r.breatheSec)}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mb-4 text-center text-sm text-foam-200/55">
        {mode === "coach" ? (
          <>
            {table.length} open holds · go max at the ends, ease to ~1:00 in the
            middle · {formatTime(table[0].breatheSec)} rest
          </>
        ) : mode === "custom" ? (
          <>
            {table.length} rounds · estimated {formatTime(total)}
            {table.some((round) => round.open) ? " plus open-hold time" : ""}
          </>
        ) : (
          <>
            Total ≈ {formatTime(total)} · constant {formatTime(table[0].holdSec)}{" "}
            holds, shrinking rest
          </>
        )}
      </p>

      <button
        onClick={() => setRunning(true)}
        disabled={!tableIsValid}
        className="w-full rounded-xl bg-current-400 px-4 py-4 text-lg font-semibold text-abyss-950 transition hover:bg-current-300 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Run table
      </button>
      {!tableIsValid && (
        <p className="mt-2 text-center text-sm text-coral-300">
          Every timed hold must be at least one second.
        </p>
      )}

      {!isTemplate && (
        <div className="mt-4 border-t border-current-300/10 pt-4">
          <span className="text-sm font-medium text-foam-200/90">Save as template</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => {
                setName(e.target.value);
                if (tmplSave !== "idle") setTmplSave("idle");
              }}
              placeholder="e.g. Coach's CO2"
              className="flex-1 rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 placeholder:text-foam-200/30 outline-none transition focus:border-current-300/60"
            />
            <button
              onClick={handleSaveTemplate}
              disabled={name.trim() === "" || tmplSave === "saving" || !tableIsValid}
              className="rounded-xl border border-current-300/25 px-4 py-2.5 font-medium text-foam-100 transition hover:bg-surface-raised/60 disabled:opacity-50"
            >
              {tmplSave === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
          {tmplSave === "done" && (
            <p className="mt-2 text-sm text-current-300">Saved to your tables.</p>
          )}
          {tmplSave === "error" && (
            <p className="mt-2 text-sm text-coral-300">{tmplError}</p>
          )}
        </div>
      )}
    </div>
  );
}
