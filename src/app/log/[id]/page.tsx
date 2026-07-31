import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DISCIPLINES, type Discipline, formatTime } from "@/lib/disciplines";
import { SessionForm, type SessionDefaults } from "../SessionForm";
import { updateSession, deleteSession } from "../actions";
import { toDateInput } from "../dateUtil";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const session = await prisma.trainingSession.findFirst({
    where: { id, userId: user.id },
  });
  if (!session) notFound();

  const discipline = session.discipline as Discipline;
  const meta = DISCIPLINES[discipline];

  const resultStr =
    meta.resultKind === "time"
      ? session.resultSeconds != null
        ? formatTime(session.resultSeconds)
        : ""
      : session.resultMeters != null
        ? String(session.resultMeters)
        : "";

  const defaults: SessionDefaults = {
    discipline,
    date: toDateInput(session.date),
    result: resultStr,
    location: session.location ?? "",
    locationType: session.locationType ?? "",
    staEnvironment: session.staEnvironment ?? "DRY",
    buddy: session.buddy ?? "",
    waterTempC: session.waterTempC != null ? String(session.waterTempC) : "",
    eqNotes: session.eqNotes ?? "",
    feltNotes: session.feltNotes ?? "",
    feltRating: session.feltRating != null ? String(session.feltRating) : "",
  };

  const updateAction = updateSession.bind(null, id);
  const deleteAction = deleteSession.bind(null, id);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8 safe-bottom">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/log" className="text-current-300" aria-label="Back to log">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foam-100">
          Edit session
        </h1>
      </header>

      <div className="card p-5">
        <SessionForm action={updateAction} defaults={defaults} submitLabel="Save changes" />
      </div>

      <form action={deleteAction} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-xl border border-coral-400/25 px-4 py-3 text-center font-medium text-coral-300 transition hover:bg-coral-400/10"
        >
          Delete session
        </button>
      </form>
    </main>
  );
}
