import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-deep-500/30 ring-1 ring-current-300/30">
          <WaveMark className="h-9 w-9 text-current-300" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foam-100">
          Respiro
        </h1>
        <p className="mt-3 text-balance text-foam-200/80">
          Log sessions, track your PBs, and run CO2/O2 tables with audio cues —
          no stopwatch, no paper.
        </p>
      </div>

      <div className="card p-6 safe-bottom">
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-current-400 px-4 py-3 text-center font-medium text-abyss-950 transition hover:bg-current-300"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-current-300/25 px-4 py-3 text-center font-medium text-foam-100 transition hover:bg-surface-raised/60"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}

function WaveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 14c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
