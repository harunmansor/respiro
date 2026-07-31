import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { AuthForm } from "../AuthForm";
import { signup } from "../actions";

export default async function SignupPage() {
  if (await getCurrentUserId()) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foam-100">
          Create your account
        </h1>
        <p className="mt-2 text-foam-200/70">
          Start logging dives and running tables.
        </p>
      </div>

      <div className="card p-6 safe-bottom">
        <AuthForm action={signup} mode="signup" />
        <p className="mt-5 text-center text-sm text-foam-200/70">
          Already have an account?{" "}
          <Link href="/login" className="text-current-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
