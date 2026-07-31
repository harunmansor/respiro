import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePersonalBests, type SessionLike } from "@/lib/pb";
import type { Discipline } from "@/lib/disciplines";
import { logout } from "../(auth)/actions";
import { ProfileNameForm, ChangePasswordForm } from "./ProfileForms";
import { BottomNav } from "@/components/BottomNav";

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const current = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: { email: true, name: true, createdAt: true },
  });
  if (!user) {
    // Cookie valid but the row is gone — treat as signed out.
    await logout();
  }

  const sessions = await prisma.trainingSession.findMany({
    where: { userId: current.id },
    select: { discipline: true, date: true, resultSeconds: true, resultMeters: true },
  });

  const sessionLikes: SessionLike[] = sessions.map((s) => ({
    discipline: s.discipline as Discipline,
    date: s.date,
    resultSeconds: s.resultSeconds,
    resultMeters: s.resultMeters,
  }));

  const pbs = computePersonalBests(sessionLikes);
  const staPb = pbs.find((p) => p.discipline === "STA");

  const stats = [
    { label: "Sessions logged", value: String(sessions.length) },
    { label: "Disciplines trained", value: String(pbs.length) },
    { label: "STA PB", value: staPb ? staPb.display : "—" },
  ];

  return (
    <>
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8 pb-28">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="text-current-300" aria-label="Back to dashboard">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foam-100">Profile</h1>
      </header>

      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foam-200/60">Account</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-foam-200/60">Email</dt>
            <dd className="font-medium text-foam-100">{user!.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-foam-200/60">Member since</dt>
            <dd className="font-medium text-foam-100">{fmtDate(user!.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foam-200/60">Training summary</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-abyss-900/50 p-3 text-center ring-1 ring-current-300/10">
              <div className="text-xl font-semibold text-foam-100">{s.value}</div>
              <div className="mt-1 text-[11px] leading-tight text-foam-200/60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foam-200/60">Edit profile</h2>
        <ProfileNameForm defaultName={user!.name ?? ""} />
      </section>

      <section className="card mt-4 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foam-200/60">Change password</h2>
        <ChangePasswordForm />
      </section>

      <form action={logout} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-xl border border-coral-400/25 px-4 py-3 text-center font-medium text-coral-300 transition hover:bg-coral-400/10"
        >
          Log out
        </button>
      </form>
    </main>
    <BottomNav />
    </>
  );
}
