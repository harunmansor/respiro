import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DISCIPLINES, type Discipline } from "@/lib/disciplines";
import {
  computePersonalBests,
  disciplinesWithData,
  progressionFor,
  type SessionLike,
} from "@/lib/pb";
import { ProgressionChart, type ChartSeries } from "./ProgressionChart";
import { BottomNav } from "@/components/BottomNav";

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProgressPage() {
  const user = await requireUser();
  const rows = await prisma.trainingSession.findMany({
    where: { userId: user.id },
    select: { discipline: true, date: true, resultSeconds: true, resultMeters: true },
  });

  const sessions: SessionLike[] = rows.map((r) => ({
    discipline: r.discipline as Discipline,
    date: r.date,
    resultSeconds: r.resultSeconds,
    resultMeters: r.resultMeters,
  }));

  const pbs = computePersonalBests(sessions);
  const series: ChartSeries[] = disciplinesWithData(sessions).map((d) => ({
    discipline: d,
    points: progressionFor(sessions, d).map((p) => ({
      t: p.date.getTime(),
      value: p.value,
      best: p.best,
    })),
  }));

  return (
    <>
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-8 pb-28">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="text-current-300" aria-label="Back">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foam-100">
          Progress
        </h1>
      </header>

      {pbs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-foam-200/70">No results yet.</p>
          <Link href="/log/new" className="mt-3 inline-block text-current-300 hover:underline">
            Log a session →
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foam-200/50">
              Personal bests
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {pbs.map((pb) => (
                <div key={pb.discipline} className="card p-4">
                  <div className="text-xs font-semibold text-current-300">
                    {pb.discipline}
                  </div>
                  <div className="mt-1 text-3xl font-bold tracking-tight text-foam-100">
                    {pb.display}
                  </div>
                  <div className="mt-1 text-xs text-foam-200/55">
                    {DISCIPLINES[pb.discipline].name}
                  </div>
                  <div className="mt-0.5 text-xs text-foam-200/45">
                    set {fmtDate(pb.date)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {series.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foam-200/50">
                Progression
              </h2>
              <div className="card p-4">
                <ProgressionChart series={series} />
              </div>
            </section>
          )}
        </>
      )}
    </main>
    <BottomNav />
    </>
  );
}
