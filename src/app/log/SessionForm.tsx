"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  DISCIPLINES,
  DISCIPLINE_CODES,
  LOCATION_TYPES,
  STA_ENVIRONMENTS,
} from "@/lib/disciplines";
import type { Discipline } from "@/lib/disciplines";
import type { LogFormState } from "./actions";

export type SessionDefaults = {
  discipline: Discipline;
  date: string; // yyyy-mm-dd
  result: string;
  location: string;
  locationType: string;
  staEnvironment: string;
  buddy: string;
  waterTempC: string;
  eqNotes: string;
  feltNotes: string;
  feltRating: string;
};

type Action = (prev: LogFormState, formData: FormData) => Promise<LogFormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-current-400 px-4 py-3 text-center font-medium text-abyss-950 transition hover:bg-current-300 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function SessionForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults: SessionDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<LogFormState, FormData>(action, null);
  const [discipline, setDiscipline] = useState<Discipline>(defaults.discipline);
  const [staEnvironment, setStaEnvironment] = useState(defaults.staEnvironment);
  const [locationType, setLocationType] = useState(defaults.locationType);
  const meta = DISCIPLINES[discipline];
  const timeBased = meta.resultKind === "time";

  // Dry STA has no water and no equalization — hide those fields.
  const isDryStatic = discipline === "STA" && staEnvironment === "DRY";

  // The location-type <select> is controlled so Dry STA can force it to "Dry".
  const effectiveLocationType = isDryStatic ? "DRY" : locationType;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foam-200/90">Discipline</span>
        <select
          name="discipline"
          value={discipline}
          onChange={(e) => {
            const next = e.target.value as Discipline;
            setDiscipline(next);
            // "Dry" location only makes sense for STA — clear it when leaving.
            if (next !== "STA" && locationType === "DRY") setLocationType("");
          }}
          className="rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 outline-none transition focus:border-current-300/60"
        >
          {DISCIPLINE_CODES.map((c) => (
            <option key={c} value={c}>
              {c} — {DISCIPLINES[c].name}
            </option>
          ))}
        </select>
      </label>

      {discipline === "STA" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foam-200/90">STA type</span>
          <select
            name="staEnvironment"
            value={staEnvironment}
            onChange={(e) => {
              setStaEnvironment(e.target.value);
              // Leaving Dry STA: drop the auto-set "Dry" location.
              if (e.target.value !== "DRY" && locationType === "DRY") setLocationType("");
            }}
            className="rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 outline-none transition focus:border-current-300/60"
          >
            {STA_ENVIRONMENTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" name="date" type="date" defaultValue={defaults.date} required />
        <Field
          label={timeBased ? "Result (m:ss)" : `Result (${meta.unit})`}
          name="result"
          type="text"
          inputMode={timeBased ? "text" : "decimal"}
          defaultValue={defaults.result}
          placeholder={timeBased ? "4:12" : "75"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foam-200/90">Location type</span>
          <select
            name="locationType"
            value={effectiveLocationType}
            onChange={(e) => setLocationType(e.target.value)}
            disabled={isDryStatic}
            className="rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 outline-none transition focus:border-current-300/60 disabled:opacity-60"
          >
            <option value="">—</option>
            {LOCATION_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {isDryStatic && <input type="hidden" name="locationType" value="DRY" />}
        </label>
        <Field label="Location name" name="location" type="text" defaultValue={defaults.location} placeholder="e.g. Blue Lagoon" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Buddy" name="buddy" type="text" defaultValue={defaults.buddy} placeholder="Who with" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {!isDryStatic && (
          <Field label="Water temp (°C)" name="waterTempC" type="number" inputMode="decimal" defaultValue={defaults.waterTempC} placeholder="26" />
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foam-200/90">How it felt</span>
          <select
            name="feltRating"
            defaultValue={defaults.feltRating}
            className="rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 outline-none transition focus:border-current-300/60"
          >
            <option value="">—</option>
            <option value="1">1 · rough</option>
            <option value="2">2</option>
            <option value="3">3 · ok</option>
            <option value="4">4</option>
            <option value="5">5 · great</option>
          </select>
        </label>
      </div>

      {!isDryStatic && (
        <TextArea label="Equalization notes" name="eqNotes" defaultValue={defaults.eqNotes} placeholder="EQ technique, issues…" />
      )}
      <TextArea label="How-felt notes" name="feltNotes" defaultValue={defaults.feltNotes} placeholder="Contractions, urge to breathe, recovery…" />

      {state?.error && (
        <p role="alert" className="rounded-lg bg-coral-400/10 px-3 py-2 text-sm text-coral-300 ring-1 ring-coral-400/20">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Link
          href="/log"
          className="flex-1 rounded-xl border border-current-300/25 px-4 py-3 text-center font-medium text-foam-100 transition hover:bg-surface-raised/60"
        >
          Cancel
        </Link>
        <div className="flex-1">
          <SubmitButton label={submitLabel} />
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foam-200/90">{label}</span>
      <input
        {...props}
        className="rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 placeholder:text-foam-200/30 outline-none transition focus:border-current-300/60 focus:ring-2 focus:ring-current-300/20"
      />
    </label>
  );
}

function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foam-200/90">{label}</span>
      <textarea
        rows={2}
        {...props}
        className="resize-y rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 placeholder:text-foam-200/30 outline-none transition focus:border-current-300/60 focus:ring-2 focus:ring-current-300/20"
      />
    </label>
  );
}
