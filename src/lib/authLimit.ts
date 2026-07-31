import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = { failures: number; resetAt: number };
const attempts = new Map<string, Attempt>();

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

export function loginIsLimited(email: string): boolean {
  const key = keyFor(email);
  const current = attempts.get(key);
  if (!current) return false;
  if (current.resetAt <= Date.now()) {
    attempts.delete(key);
    return false;
  }
  return current.failures >= MAX_FAILURES;
}

export function recordLoginFailure(email: string): void {
  const key = keyFor(email);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { failures: 1, resetAt: now + WINDOW_MS });
  } else {
    current.failures += 1;
  }

  // Keep a bot from growing this process-local map without bound.
  if (attempts.size > 5_000) {
    for (const [attemptKey, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(attemptKey);
    }
    if (attempts.size > 5_000) {
      const oldest = attempts.keys().next().value;
      if (oldest) attempts.delete(oldest);
    }
  }
}

export function clearLoginFailures(email: string): void {
  attempts.delete(keyFor(email));
}
