"use client";

import { useState } from "react";
import { formatTime } from "@/lib/disciplines";
import type { TableRound } from "@/lib/tables";
import { TableSession } from "./TableSession";
import { deleteTemplate, toggleShared } from "./actions";

export type TemplateItem = {
  id: string;
  name: string;
  rounds: TableRound[];
  isShared: boolean;
  /** False for templates shared by another user — those are run-only. */
  owned: boolean;
};

function summarize(rounds: TableRound[]): string {
  const holds = rounds.length;
  const rest = rounds[0]?.breatheSec ?? 0;
  const allOpen = rounds.every((r) => r.open);
  if (allOpen) return `${holds} open holds · ${formatTime(rest)} rest`;
  const hold = rounds[0]?.holdSec ?? 0;
  return `${holds} × ${formatTime(hold)} holds · ${formatTime(rest)} rest`;
}

export function TemplateList({
  templates,
  pbSeconds,
}: {
  templates: TemplateItem[];
  pbSeconds: number;
}) {
  const [active, setActive] = useState<TemplateItem | null>(null);

  if (active) {
    return (
      <div className="card p-5">
        <TableSession
          pbSeconds={pbSeconds}
          initialRounds={active.rounds}
          templateId={active.id}
          templateName={active.name}
        />
        <button
          onClick={() => setActive(null)}
          className="mt-3 w-full rounded-xl border border-current-300/25 px-4 py-2.5 text-sm font-medium text-foam-100 transition hover:bg-surface-raised/60"
        >
          Back to tables
        </button>
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {templates.map((t) => (
        <li key={t.id} className="card p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-foam-100">{t.name}</p>
              <p className="text-xs text-foam-200/55">{summarize(t.rounds)}</p>
            </div>
            <button
              onClick={() => setActive(t)}
              className="shrink-0 rounded-lg bg-current-400 px-3.5 py-2 text-sm font-semibold text-abyss-950 transition hover:bg-current-300"
            >
              Run
            </button>
          </div>
          {t.owned && (
            <div className="mt-2 flex items-center gap-3 border-t border-current-300/10 pt-2 text-xs">
              <ShareToggle id={t.id} initial={t.isShared} />
              <DeleteButton id={t.id} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ShareToggle({ id, initial }: { id: string; initial: boolean }) {
  const [shared, setShared] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    setBusy(true);
    const next = !shared;
    const res = await toggleShared(id, next);
    if (res.ok) setShared(next);
    setBusy(false);
  }

  return (
    <button
      onClick={onToggle}
      disabled={busy}
      className={
        "rounded-md px-2 py-1 font-medium transition disabled:opacity-50 " +
        (shared
          ? "bg-current-400/15 text-current-300 ring-1 ring-current-300/25"
          : "text-foam-200/60 hover:text-foam-100")
      }
    >
      {shared ? "Shared ✓" : "Share"}
    </button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    setBusy(true);
    await deleteTemplate(id);
    // revalidatePath in the action refreshes the server component list.
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="ml-auto text-foam-200/50 transition hover:text-coral-300"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      <button
        onClick={onDelete}
        disabled={busy}
        className="font-medium text-coral-300 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Confirm"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-foam-200/50 hover:text-foam-100"
      >
        Cancel
      </button>
    </span>
  );
}
