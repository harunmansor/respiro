import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SessionForm, type SessionDefaults } from "../SessionForm";
import { createSession } from "../actions";
import { toDateInput } from "../dateUtil";

export default async function NewSessionPage() {
  await requireUser();

  const defaults: SessionDefaults = {
    discipline: "STA",
    date: toDateInput(new Date()),
    result: "",
    location: "",
    locationType: "",
    staEnvironment: "DRY",
    buddy: "",
    waterTempC: "",
    eqNotes: "",
    feltNotes: "",
    feltRating: "",
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8 safe-bottom">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/log" className="text-current-300" aria-label="Back to log">
          ←
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foam-100">
          Log a session
        </h1>
      </header>

      <div className="card p-5">
        <SessionForm action={createSession} defaults={defaults} submitLabel="Save session" />
      </div>
    </main>
  );
}
