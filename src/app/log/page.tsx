import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DISCIPLINES, formatResult, type Discipline } from "@/lib/disciplines";
import { BottomNav } from "@/components/BottomNav";

const LOCATION_TYPE_LABEL: Record<string, string> = {
  POOL: "Pool",
  OCEAN: "Ocean",
  LAKE: "Lake",
  DRY: "Dry",
};

function locationLabel(type: string | null, name: string | null): string {
  const t = type ? LOCATION_TYPE_LABEL[type] : null;
  if (t && name) return `${t} · ${name}`;
  return t ?? name ?? "";
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function LogPage() {
  const user = await requireUser();
  const sessions = await prisma.trainingSession.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return (
    <>
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8 pb-28">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-current-300" aria-label="Back">
            ←
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foam-100">
            Dive log
          </h1>
        </div>
        <Link
          href="/log/new"
          className="rounded-lg bg-current-400 px-3 py-1.5 text-sm font-medium text-abyss-950 transition hover:bg-current-300"
        >
          + New
        </Link>
      </header>

      {sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-foam-200/70">No sessions yet.</p>
          <Link
            href="/log/new"
            className="mt-3 inline-block text-current-300 hover:underline"
          >
            Log your first one →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => {
            const meta = DISCIPLINES[s.discipline as Discipline];
            return (
              <li key={s.id}>
                <Link
                  href={`/log/${s.id}`}
                  className="card flex items-center justify-between p-4 transition hover:bg-surface-raised/70"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-deep-500/30 px-2 py-0.5 text-xs font-semibold text-current-300 ring-1 ring-current-300/20">
                        {meta.code}
                      </span>
                      <span className="text-lg font-semibold text-foam-100">
                        {formatResult(s.discipline as Discipline, s.resultSeconds, s.resultMeters)}
                      </span>
                      {s.discipline === "STA" && s.staEnvironment && (
                        <span className="rounded-md bg-abyss-800/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foam-200/70 ring-1 ring-current-300/15">
                          {s.staEnvironment === "DRY" ? "Dry" : "Wet"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foam-200/60">
                      {fmtDate(s.date)}
                      {locationLabel(s.locationType, s.location)
                        ? ` · ${locationLabel(s.locationType, s.location)}`
                        : ""}
                    </p>
                  </div>
                  <span aria-hidden className="text-current-300">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
    <BottomNav />
    </>
  );
}
