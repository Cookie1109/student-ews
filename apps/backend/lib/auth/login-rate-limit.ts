const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

interface Attempt {
  failures: number;
  resetAt: number;
}

const globalLimiter = globalThis as unknown as { loginAttempts?: Map<string, Attempt> };
const attempts = globalLimiter.loginAttempts ?? new Map<string, Attempt>();
if (process.env.NODE_ENV !== "production") globalLimiter.loginAttempts = attempts;

export function loginAttemptKey(ip: string, username: string) {
  return `${ip}:${username.trim().toLocaleLowerCase()}`;
}

export function checkLoginAttempt(key: string, now = Date.now()) {
  const attempt = attempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    if (attempt) attempts.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: attempt.failures < MAX_FAILURES,
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - now) / 1000)),
  };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { failures: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.failures++;
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
