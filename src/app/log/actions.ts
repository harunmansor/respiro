"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { DISCIPLINE_CODES, isTimeBased, parseTime } from "@/lib/disciplines";

export type LogFormState = { error: string } | null;

const baseSchema = z.object({
  discipline: z.enum(DISCIPLINE_CODES as [string, ...string[]]),
  date: z.string().min(1, "Date is required."),
  result: z.string().trim(),
  location: z.string().trim().max(120).optional(),
  locationType: z.enum(["POOL", "OCEAN", "LAKE", "DRY"]).optional(),
  staEnvironment: z.enum(["DRY", "WET"]).optional(),
  buddy: z.string().trim().max(120).optional(),
  waterTempC: z.string().trim().optional(),
  eqNotes: z.string().trim().max(2000).optional(),
  feltNotes: z.string().trim().max(2000).optional(),
  feltRating: z.string().trim().optional(),
});

type ParsedSession = {
  discipline: (typeof DISCIPLINE_CODES)[number];
  date: Date;
  resultSeconds: number | null;
  resultMeters: number | null;
  location: string | null;
  locationType: "POOL" | "OCEAN" | "LAKE" | "DRY" | null;
  staEnvironment: "DRY" | "WET" | null;
  buddy: string | null;
  waterTempC: number | null;
  eqNotes: string | null;
  feltNotes: string | null;
  feltRating: number | null;
};

function optNum(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseForm(
  formData: FormData,
): { ok: true; data: ParsedSession } | { ok: false; error: string } {
  const parsed = baseSchema.safeParse({
    discipline: formData.get("discipline"),
    date: formData.get("date"),
    result: formData.get("result"),
    location: formData.get("location") || undefined,
    locationType: formData.get("locationType") || undefined,
    staEnvironment: formData.get("staEnvironment") || undefined,
    buddy: formData.get("buddy") || undefined,
    waterTempC: formData.get("waterTempC") || undefined,
    eqNotes: formData.get("eqNotes") || undefined,
    feltNotes: formData.get("feltNotes") || undefined,
    feltRating: formData.get("feltRating") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const v = parsed.data;
  const discipline = v.discipline as (typeof DISCIPLINE_CODES)[number];

  const date = new Date(v.date);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Invalid date." };
  }

  let resultSeconds: number | null = null;
  let resultMeters: number | null = null;
  if (v.result !== "") {
    if (isTimeBased(discipline)) {
      const secs = parseTime(v.result);
      if (secs == null) {
        return { ok: false, error: "Enter time as m:ss (e.g. 4:12)." };
      }
      resultSeconds = secs;
    } else {
      const m = Number(v.result);
      if (!Number.isFinite(m) || m < 0) {
        return { ok: false, error: "Enter result in meters (e.g. 75)." };
      }
      resultMeters = m;
    }
  }

  const rating = optNum(v.feltRating);

  // "Dry" is a dry-STA concept; it must never attach to a water discipline.
  const locationType =
    v.locationType === "DRY" && discipline !== "STA" ? null : (v.locationType ?? null);

  return {
    ok: true,
    data: {
      discipline,
      date,
      resultSeconds,
      resultMeters,
      location: v.location ?? null,
      locationType,
      // dry/wet only applies to STA; drop it otherwise so stale values don't persist.
      staEnvironment: discipline === "STA" ? (v.staEnvironment ?? null) : null,
      buddy: v.buddy ?? null,
      waterTempC: optNum(v.waterTempC),
      eqNotes: v.eqNotes ?? null,
      feltNotes: v.feltNotes ?? null,
      feltRating: rating != null ? Math.min(5, Math.max(1, Math.round(rating))) : null,
    },
  };
}

export async function createSession(
  _prev: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  const user = await requireUser();
  const parsed = parseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.trainingSession.create({
    data: { userId: user.id, ...parsed.data },
  });

  revalidatePath("/log");
  redirect("/log");
}

export async function updateSession(
  id: string,
  _prev: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  const user = await requireUser();
  const parsed = parseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  // Scope the update to the owner so users can't edit others' sessions.
  const result = await prisma.trainingSession.updateMany({
    where: { id, userId: user.id },
    data: parsed.data,
  });
  if (result.count === 0) return { error: "Session not found." };

  revalidatePath("/log");
  redirect(`/log/${id}`);
}

export async function deleteSession(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.trainingSession.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/log");
  redirect("/log");
}
