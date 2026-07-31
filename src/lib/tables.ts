export type TableType = "CO2" | "O2";
export const MAX_TABLE_ROUNDS = 30;
export const MAX_PHASE_SECONDS = 60 * 60;

export interface TableRound {
  /** Breath-hold duration in seconds. For open holds this is the target/expected
   *  duration only — the runner counts up and the diver ends the hold manually. */
  holdSec: number;
  /** Rest / breathe-up duration before the next hold, in seconds. */
  breatheSec: number;
  /** Open hold: count up with no auto-end; the diver taps "Done" when they stop. */
  open?: boolean;
  /** Optional soft target (seconds) shown as a marker during an open hold. */
  targetSec?: number;
}

export interface GenerateOptions {
  /** The diver's static PB in seconds, used as the basis for the table. */
  pbSeconds: number;
  /** Number of rounds (holds). Default 8. */
  rounds?: number;
}

/**
 * CO2 table: hold time stays constant (a comfortable % of PB) while the
 * breathe-up (recovery) shrinks each round, building CO2 tolerance.
 */
export function generateCO2Table({ pbSeconds, rounds = 8 }: GenerateOptions): TableRound[] {
  // Hold at ~50% of PB — a safe, repeatable effort.
  const hold = Math.max(15, Math.round((pbSeconds * 0.5) / 5) * 5);
  // Start rest generously, then decrease by 15s each round, floor at 30s.
  const startBreathe = 120;
  const step = 15;
  const minBreathe = 30;

  const table: TableRound[] = [];
  for (let i = 0; i < rounds; i++) {
    const breatheSec = Math.max(minBreathe, startBreathe - i * step);
    table.push({ holdSec: hold, breatheSec });
  }
  return table;
}

/**
 * O2 table: breathe-up (recovery) stays constant while hold time grows each
 * round toward the PB, building O2 tolerance / apnea endurance.
 */
export function generateO2Table({ pbSeconds, rounds = 8 }: GenerateOptions): TableRound[] {
  const breatheSec = 120;
  // Ramp holds from ~40% up to ~80% of PB across the rounds.
  const startFrac = 0.4;
  const endFrac = 0.8;

  const table: TableRound[] = [];
  for (let i = 0; i < rounds; i++) {
    const frac = rounds === 1 ? endFrac : startFrac + ((endFrac - startFrac) * i) / (rounds - 1);
    const holdSec = Math.max(15, Math.round((pbSeconds * frac) / 5) * 5);
    table.push({ holdSec, breatheSec });
  }
  return table;
}

export function generateTable(type: TableType, opts: GenerateOptions): TableRound[] {
  return type === "CO2" ? generateCO2Table(opts) : generateO2Table(opts);
}

export interface CoachUOptions {
  /** Number of rounds (holds). Default 8. */
  rounds?: number;
  /** Constant rest / breathe-up before each hold, in seconds. Default 30. */
  restSec?: number;
}

/**
 * "Coach" U-table: every hold is open-ended (hold until you need to stop). The
 * effort follows a U-shape — max at the ends, easing to ~1:00 in the middle —
 * but only the two middle rounds carry a visible 1:00 target marker. The end
 * rounds are pure "go as long as you can" with no marker.
 */
export function generateCoachUTable({ rounds = 8, restSec = 30 }: CoachUOptions = {}): TableRound[] {
  // The two innermost rounds (0-indexed middle pair) get the 1:00 marker.
  const midLow = Math.floor((rounds - 1) / 2);
  const midHigh = Math.ceil((rounds - 1) / 2);

  const table: TableRound[] = [];
  for (let i = 0; i < rounds; i++) {
    const isMiddle = i === midLow || i === midHigh;
    table.push({
      holdSec: isMiddle ? 60 : 0, // expected/target; 0 = no target for end rounds
      breatheSec: restSec,
      open: true,
      ...(isMiddle ? { targetSec: 60 } : {}),
    });
  }
  return table;
}

export function totalTableSeconds(rounds: TableRound[]): number {
  return rounds.reduce((sum, r) => sum + r.holdSec + r.breatheSec, 0);
}

export function isValidRounds(value: unknown): value is TableRound[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= MAX_TABLE_ROUNDS &&
    value.every((raw) => {
      if (raw == null || typeof raw !== "object") return false;
      const r = raw as TableRound;
      if (
        typeof r.holdSec !== "number" ||
        !Number.isInteger(r.holdSec) ||
        r.holdSec < 0 ||
        r.holdSec > MAX_PHASE_SECONDS
      ) return false;
      if (
        typeof r.breatheSec !== "number" ||
        !Number.isInteger(r.breatheSec) ||
        r.breatheSec < 0 ||
        r.breatheSec > MAX_PHASE_SECONDS
      ) return false;
      if (r.open !== undefined && typeof r.open !== "boolean") return false;
      if (!r.open && r.holdSec === 0) return false;
      if (
        r.targetSec !== undefined &&
        (typeof r.targetSec !== "number" ||
          !Number.isInteger(r.targetSec) ||
          r.targetSec < 0 ||
          r.targetSec > MAX_PHASE_SECONDS)
      ) {
        return false;
      }
      return true;
    })
  );
}
