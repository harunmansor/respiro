"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  clearLoginFailures,
  loginIsLimited,
  recordLoginFailure,
} from "@/lib/authLimit";

export type AuthState = { error: string } | null;

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  name: z
    .string()
    .trim()
    .max(60, "Name is too long.")
    .optional()
    .transform((v) => (v ? v : undefined)),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine((value) => new TextEncoder().encode(value).length <= 72, {
      message: "Password must be no more than 72 bytes.",
    }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

// Comparing against a real bcrypt hash even when an email does not exist avoids
// exposing registered addresses through a large response-timing difference.
const INVALID_PASSWORD_HASH =
  "$2b$12$Dnt5DiUPp6zBH/9cZaPpZOY1gjM5iz7jfgkLxUG4DLjedJ7GZTfqy";

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;
  if (loginIsLimited(email)) {
    return { error: "Too many failed attempts. Try again in 15 minutes." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  const passwordOk = await verifyPassword(
    password,
    user?.passwordHash ?? INVALID_PASSWORD_HASH,
  );
  if (!user || !passwordOk) {
    recordLoginFailure(email);
    return { error: "Incorrect email or password." };
  }

  clearLoginFailures(email);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
