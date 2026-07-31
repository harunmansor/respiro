"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, changePassword, type ProfileState } from "./actions";

type Action = (prev: ProfileState, formData: FormData) => Promise<ProfileState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-current-400 px-4 py-3 text-center font-medium text-abyss-950 transition hover:bg-current-300 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Notice({ state }: { state: ProfileState }) {
  if (!state) return null;
  if ("error" in state) {
    return (
      <p role="alert" className="rounded-lg bg-coral-400/10 px-3 py-2 text-sm text-coral-300 ring-1 ring-coral-400/20">
        {state.error}
      </p>
    );
  }
  return (
    <p role="status" className="rounded-lg bg-current-400/10 px-3 py-2 text-sm text-current-300 ring-1 ring-current-300/20">
      {state.ok}
    </p>
  );
}

export function ProfileNameForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfile as Action,
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Display name" name="name" type="text" defaultValue={defaultName} placeholder="Your name" maxLength={60} />
      <Notice state={state} />
      <SubmitButton label="Save profile" />
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    changePassword as Action,
    null,
  );
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" />
      <Field label="New password" name="newPassword" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
      <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" />
      <Notice state={state} />
      <SubmitButton label="Change password" />
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
