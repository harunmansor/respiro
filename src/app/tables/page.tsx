import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTime, type Discipline } from "@/lib/disciplines";
import { computePersonalBests, type SessionLike } from "@/lib/pb";
import { isValidRounds, type TableRound } from "@/lib/tables";
import { TableSession } from "./TableSession";
import { TemplateList, type TemplateItem } from "./TemplateList";
import { BottomNav } from "@/components/BottomNav";

const DEFAULT_PB_SECONDS = 120; // 2:00 fallback when no STA PB is logged yet

function fmtDateTime(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default async function TablesPage() {
  const user = await requireUser();

  const [staSessions, runs, ownTemplates, sharedTemplates] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { userId: user.id, discipline: "STA" },
      select: { discipline: true, date: true, resultSeconds: true, resultMeters: true },
    }),
    prisma.tableRun.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.tableTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tableTemplate.findMany({
      where: { isShared: true, userId: { not: user.id } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const toItem = (
    t: { id: string; name: string; rounds: unknown; isShared: boolean },
    owned: boolean,
  ): TemplateItem | null => {
    if (!isValidRounds(t.rounds)) return null;
    return { id: t.id, name: t.name, rounds: t.rounds as TableRound[], isShared: t.isShared, owned };
  };

  const ownItems = ownTemplates
    .map((t) => toItem(t, true))
    .filter((t): t is TemplateItem => t != null);
  const sharedItems = sharedTemplates
    .map((t) => toItem(t, false))
    .filter((t): t is TemplateItem => t != null);

  const sessions: SessionLike[] = staSessions.map((s) => ({
    discipline: s.discipline as Discipline,
    date: s.date,
    resultSeconds: s.resultSeconds,
    resultMeters: s.resultMeters,
  }));
  const staPB = computePersonalBests(sessions).find((p) => p.discipline === "STA");
  const pbSeconds = staPB?.value ?? DEFAULT_PB_SECONDS;

  return (
    <>
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8 pb-28">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="text-current-300" aria-label="Back">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foam-100">
          CO2 table
        </h1>
      </header>

      <p className="mb-5 text-sm text-foam-200/65">
        {staPB ? (
          <>Based on your static PB of <strong>{formatTime(pbSeconds)}</strong>.</>
        ) : (
          <>
            No static PB yet — using a default of {formatTime(pbSeconds)}.{" "}
            <Link href="/log/new" className="text-current-300 hover:underline">
              Log an STA
            </Link>{" "}
            to personalize it.
          </>
        )}
      </p>

      <div className="card p-5">
        <TableSession pbSeconds={pbSeconds} />
      </div>

      {ownItems.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foam-200/50">
            Your tables
          </h2>
          <TemplateList templates={ownItems} pbSeconds={pbSeconds} />
        </section>
      )}

      {sharedItems.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foam-200/50">
            Shared with you
          </h2>
          <TemplateList templates={sharedItems} pbSeconds={pbSeconds} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foam-200/50">
          Recent runs
        </h2>
        {runs.length === 0 ? (
          <p className="text-sm text-foam-200/50">No runs yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {runs.map((r) => {
              const total = Array.isArray(r.rounds) ? r.rounds.length : 0;
              return (
                <li
                  key={r.id}
                  className="card flex items-center justify-between p-3.5 text-sm"
                >
                  <span className="text-foam-100">
                    {r.completedRounds}/{total} holds
                    {r.maxHoldSec ? (
                      <span className="text-foam-200/55">
                        {" "}· max {formatTime(r.maxHoldSec)}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-foam-200/50">{fmtDateTime(r.startedAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
    <BottomNav />
    </>
  );
}
