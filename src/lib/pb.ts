import {
  DISCIPLINE_CODES,
  formatResult,
  resultValue,
  type Discipline,
} from "@/lib/disciplines";

/** Minimal session shape the PB math needs. */
export interface SessionLike {
  discipline: Discipline;
  date: Date;
  resultSeconds: number | null;
  resultMeters: number | null;
}

export interface PersonalBest {
  discipline: Discipline;
  /** Numeric value (seconds for time, meters for distance/depth). */
  value: number;
  /** Display string, e.g. "4:12" or "75 m". */
  display: string;
  /** When the PB was set. */
  date: Date;
}

/** A point on a discipline's progression line: the best result achieved up to and including this date. */
export interface ProgressionPoint {
  date: Date;
  /** The result of the session on this date. */
  value: number;
  /** Running best ("PB so far") up to and including this date. */
  best: number;
}

/** Higher numeric result is better for every current discipline (longer hold / further / deeper). */
function isBetter(candidate: number, current: number): boolean {
  return candidate > current;
}

/** Compute the personal best per discipline. Returns only disciplines that have at least one logged result. */
export function computePersonalBests(sessions: SessionLike[]): PersonalBest[] {
  const best = new Map<Discipline, PersonalBest>();

  for (const s of sessions) {
    const value = resultValue(s.discipline, s.resultSeconds, s.resultMeters);
    if (value == null) continue;

    const existing = best.get(s.discipline);
    if (!existing || isBetter(value, existing.value)) {
      best.set(s.discipline, {
        discipline: s.discipline,
        value,
        display: formatResult(s.discipline, s.resultSeconds, s.resultMeters),
        date: s.date,
      });
    }
  }

  // Stable, discipline-order output.
  return DISCIPLINE_CODES.map((d) => best.get(d)).filter(
    (pb): pb is PersonalBest => pb != null,
  );
}

/** Build the running-best progression for one discipline, ordered oldest → newest. */
export function progressionFor(
  sessions: SessionLike[],
  discipline: Discipline,
): ProgressionPoint[] {
  const points = sessions
    .filter((s) => s.discipline === discipline)
    .map((s) => ({
      date: s.date,
      value: resultValue(s.discipline, s.resultSeconds, s.resultMeters),
    }))
    .filter((p): p is { date: Date; value: number } => p.value != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let best = -Infinity;
  return points.map((p) => {
    if (isBetter(p.value, best)) best = p.value;
    return { date: p.date, value: p.value, best };
  });
}

/** Disciplines that have at least one logged result, in canonical order. */
export function disciplinesWithData(sessions: SessionLike[]): Discipline[] {
  const set = new Set<Discipline>();
  for (const s of sessions) {
    if (resultValue(s.discipline, s.resultSeconds, s.resultMeters) != null) {
      set.add(s.discipline);
    }
  }
  return DISCIPLINE_CODES.filter((d) => set.has(d));
}
