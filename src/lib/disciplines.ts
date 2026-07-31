export type Discipline = "STA" | "DYN" | "DNF" | "CWT" | "FIM" | "CNF";

export type ResultKind = "time" | "distance" | "depth";

export interface DisciplineMeta {
  code: Discipline;
  name: string;
  resultKind: ResultKind;
  unit: string;
  /** Higher numeric result is always "better" for all current disciplines. */
}

export const DISCIPLINES: Record<Discipline, DisciplineMeta> = {
  STA: { code: "STA", name: "Static Apnea", resultKind: "time", unit: "mm:ss" },
  DYN: { code: "DYN", name: "Dynamic With Fins", resultKind: "distance", unit: "m" },
  DNF: { code: "DNF", name: "Dynamic No Fins", resultKind: "distance", unit: "m" },
  CWT: { code: "CWT", name: "Constant Weight", resultKind: "depth", unit: "m" },
  FIM: { code: "FIM", name: "Free Immersion", resultKind: "depth", unit: "m" },
  CNF: { code: "CNF", name: "Constant Weight No Fins", resultKind: "depth", unit: "m" },
};

export const DISCIPLINE_CODES = Object.keys(DISCIPLINES) as Discipline[];

export type LocationType = "POOL" | "OCEAN" | "LAKE" | "DRY";

export const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: "POOL", label: "Pool" },
  { value: "OCEAN", label: "Ocean" },
  { value: "LAKE", label: "Lake" },
  { value: "DRY", label: "Dry" },
];

export type StaEnvironment = "DRY" | "WET";

export const STA_ENVIRONMENTS: { value: StaEnvironment; label: string }[] = [
  { value: "DRY", label: "Dry STA" },
  { value: "WET", label: "Wet STA" },
];

export function isTimeBased(d: Discipline): boolean {
  return DISCIPLINES[d].resultKind === "time";
}

/** Format seconds as m:ss (e.g. 252 -> "4:12"). */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Parse "4:12" or "252" into seconds. Returns null if invalid. */
export function parseTime(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (trimmed.includes(":")) {
    const [m, s] = trimmed.split(":");
    const mins = Number(m);
    const secs = Number(s);
    if (!Number.isFinite(mins) || !Number.isFinite(secs) || secs >= 60 || secs < 0) {
      return null;
    }
    return mins * 60 + secs;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Render a stored session result for display, by discipline. */
export function formatResult(
  d: Discipline,
  resultSeconds: number | null,
  resultMeters: number | null,
): string {
  if (isTimeBased(d)) {
    return resultSeconds != null ? formatTime(resultSeconds) : "—";
  }
  return resultMeters != null ? `${resultMeters} m` : "—";
}

/** Numeric value used for comparing/charting a result, by discipline. */
export function resultValue(
  d: Discipline,
  resultSeconds: number | null,
  resultMeters: number | null,
): number | null {
  return isTimeBased(d) ? resultSeconds : resultMeters;
}
