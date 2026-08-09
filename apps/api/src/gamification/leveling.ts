/** Daraja/streak sof hisoblash (§7.13) — unit-test qilinadi. */

/** Har 100 XP = 1 daraja. Level 1 dan boshlanadi. */
export function levelForXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}

/** Keyingi darajaga qolgan XP. */
export function xpToNextLevel(xp: number): number {
  const level = levelForXp(xp);
  return level * 100 - xp;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function isYesterday(prev: Date, today: Date): boolean {
  const y = new Date(today);
  y.setUTCDate(y.getUTCDate() - 1);
  return isSameDay(prev, y);
}

/** Streakni yangilaydi: o'sha kun → o'zgarmaydi, kecha → +1, aks holda → 1. */
export function nextStreak(current: number, lastActiveOn: Date | null, now: Date): number {
  if (!lastActiveOn) return 1;
  if (isSameDay(lastActiveOn, now)) return current;
  if (isYesterday(lastActiveOn, now)) return current + 1;
  return 1;
}
