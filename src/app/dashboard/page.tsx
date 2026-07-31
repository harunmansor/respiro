import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePersonalBests, type SessionLike } from "@/lib/pb";
import { DISCIPLINES, formatResult, type Discipline } from "@/lib/disciplines";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

export default async function DashboardPage() {
  const user = await requireUser();
  const greeting = user.name?.split(" ")[0] ?? "diver";
  const [sessions, runCount] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: { id: true, discipline: true, date: true, resultSeconds: true, resultMeters: true },
    }),
    prisma.tableRun.count({ where: { userId: user.id } }),
  ]);
  const sessionLikes = sessions as SessionLike[];
  const pbs = computePersonalBests(sessionLikes);
  const sta = pbs.find((pb) => pb.discipline === "STA");
  const latest = sessions[0];

  return (
    <AppShell title={`Good to see you, ${greeting}.`} eyebrow="Training overview">
      <section className="hero-panel">
        <div className="hero-glow" />
        <div className="relative z-10 max-w-md">
          <p className="eyebrow text-current-300">Static personal best</p>
          <p className="mt-2 text-6xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">
            {sta?.display ?? "—"}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-foam-200/60">
            {sta
              ? "Your current benchmark. Build your next CO₂ session around it."
              : "Log a static apnea result to personalize your training tables."}
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/tables" className="primary-button">
              <Icon name="timer" /> Start a table
            </Link>
            <Link href="/log/new" className="secondary-button">
              <Icon name="plus" /> Log session
            </Link>
          </div>
        </div>
        <div className="depth-lines" aria-hidden>
          <span /><span /><span /><span />
        </div>
      </section>

      <section className="stats-grid">
        <Stat value={String(sessions.length)} label="Sessions" />
        <Stat value={String(runCount)} label="Table runs" />
        <Stat value={String(pbs.length)} label="Disciplines" />
      </section>

      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <div><p className="eyebrow">Your records</p><h2>Personal bests</h2></div>
            <Link href="/progress">View progress <span>→</span></Link>
          </div>
          {pbs.length ? (
            <div className="pb-grid">
              {pbs.slice(0, 4).map((pb) => (
                <Link href="/progress" key={pb.discipline} className="pb-card">
                  <span className="discipline-badge">{pb.discipline}</span>
                  <strong>{pb.display}</strong>
                  <small>{DISCIPLINES[pb.discipline].name}</small>
                </Link>
              ))}
            </div>
          ) : <EmptyState />}
        </section>

        <section>
          <div className="section-heading">
            <div><p className="eyebrow">Latest activity</p><h2>Recent session</h2></div>
            <Link href="/log">Dive log <span>→</span></Link>
          </div>
          {latest ? (
            <Link href={`/log/${latest.id}`} className="recent-card">
              <div className="recent-icon">{latest.discipline}</div>
              <div className="min-w-0">
                <p>{DISCIPLINES[latest.discipline as Discipline].name}</p>
                <strong>{formatResult(latest.discipline as Discipline, latest.resultSeconds, latest.resultMeters)}</strong>
                <small>{latest.date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</small>
              </div>
              <Icon name="arrow" className="ml-auto h-5 w-5 text-current-300" />
            </Link>
          ) : <EmptyState />}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card"><strong>{value}</strong><span>{label}</span></div>
  );
}

function EmptyState() {
  return <div className="empty-state">Your training story starts with the next session.</div>;
}
