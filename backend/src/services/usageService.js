export const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT || 10);

/** Returns today's UTC day-key, e.g. "2026-07-06". */
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Mutates (in memory) a user's usage sub-doc if the day has rolled over. */
export function rolloverUsageIfNeeded(user) {
  const key = todayKey();
  if (!user.usage || user.usage.day !== key) {
    user.usage = { day: key, count: 0 };
  }
  return user;
}

/** Returns { count, limit, remaining, unlimited } for a user, without mutating anything. */
export function getUsageSnapshot(user) {
  const unlimited = user.plan === "pro";
  const key = todayKey();
  const count = user.usage && user.usage.day === key ? user.usage.count : 0;
  const limit = unlimited ? null : FREE_DAILY_LIMIT;
  const remaining = unlimited ? null : Math.max(0, FREE_DAILY_LIMIT - count);
  return { count, limit, remaining, unlimited, day: key };
}

export function msUntilMidnightUTC() {
  const now = new Date();
  const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
  return nextMidnight - now.getTime();
}
