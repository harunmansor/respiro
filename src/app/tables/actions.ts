"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  isValidRounds,
  MAX_PHASE_SECONDS,
  MAX_TABLE_ROUNDS,
  type TableRound,
} from "@/lib/tables";

const saveRunSchema = z.object({
  rounds: z.array(
    z.object({
      holdSec: z.number().int().min(0).max(MAX_PHASE_SECONDS),
      breatheSec: z.number().int().min(0).max(MAX_PHASE_SECONDS),
      open: z.boolean().optional(),
      targetSec: z.number().int().min(0).max(MAX_PHASE_SECONDS).optional(),
    }),
  ).min(1).max(MAX_TABLE_ROUNDS),
  completedRounds: z.number().int().min(0),
  maxHoldSec: z.number().int().min(0).nullable(),
});

export async function saveTableRun(input: {
  rounds: TableRound[];
  completedRounds: number;
  maxHoldSec: number | null;
  templateId?: string | null;
}): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = saveRunSchema.safeParse(input);
  if (!parsed.success || !isValidRounds(parsed.data.rounds)) {
    return { ok: false };
  }
  if (parsed.data.completedRounds > parsed.data.rounds.length) {
    return { ok: false };
  }

  // Only link a templateId the user is actually allowed to use (own or shared).
  let templateId: string | null = null;
  if (input.templateId) {
    const tmpl = await prisma.tableTemplate.findFirst({
      where: {
        id: input.templateId,
        OR: [{ userId: user.id }, { isShared: true }],
      },
      select: { id: true },
    });
    templateId = tmpl?.id ?? null;
  }

  await prisma.tableRun.create({
    data: {
      userId: user.id,
      type: "CO2",
      templateId,
      rounds: parsed.data.rounds as unknown as Prisma.InputJsonValue,
      completedRounds: parsed.data.completedRounds,
      maxHoldSec: parsed.data.maxHoldSec,
      finishedAt: new Date(),
    },
  });

  revalidatePath("/tables");
  return { ok: true };
}

const saveTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60, "Name is too long."),
  rounds: saveRunSchema.shape.rounds,
  basedOnPBSeconds: z.number().int().min(0).nullable().optional(),
});

export async function saveTemplate(input: {
  name: string;
  rounds: TableRound[];
  basedOnPBSeconds?: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (!isValidRounds(parsed.data.rounds)) {
    return { ok: false, error: "Invalid table." };
  }

  await prisma.tableTemplate.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      type: "CO2",
      rounds: parsed.data.rounds as unknown as Prisma.InputJsonValue,
      basedOnPBSeconds: parsed.data.basedOnPBSeconds ?? null,
    },
  });

  revalidatePath("/tables");
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const res = await prisma.tableTemplate.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/tables");
  return { ok: res.count > 0 };
}

export async function toggleShared(
  id: string,
  isShared: boolean,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const res = await prisma.tableTemplate.updateMany({
    where: { id, userId: user.id },
    data: { isShared },
  });
  revalidatePath("/tables");
  return { ok: res.count > 0 };
}
