"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "./actions";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-current-400 px-4 py-3 text-center font-medium text-abyss-950 transition hover:bg-current-300 disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

export function AuthForm({
  action,
  mode,
}: {
  action: Action;
  mode: "login" | "signup";
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "signup" && (
        <Field
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Optional"
        />
      )}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
      />

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-coral-400/10 px-3 py-2 text-sm text-coral-300 ring-1 ring-coral-400/20"
        >
          {state.error}
        </p>
      )}

      <SubmitButton label={mode === "signup" ? "Create account" : "Log in"} />
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foam-200/90">{label}</span>
      <input
        {...props}
        className="rounded-xl border border-current-300/20 bg-abyss-900/60 px-3.5 py-2.5 text-foam-100 placeholder:text-foam-200/30 outline-none transition focus:border-current-300/60 focus:ring-2 focus:ring-current-300/20"
      />
    </label>
  );
}
