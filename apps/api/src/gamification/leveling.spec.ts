import { levelForXp, nextStreak, xpToNextLevel } from './leveling';

describe('Gamifikatsiya hisoblash', () => {
  it('daraja XP dan to\'g\'ri', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(250)).toBe(3);
  });

  it('keyingi darajaga qolgan XP', () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(150)).toBe(50);
  });

  it('streak: o\'sha kun → o\'zgarmaydi', () => {
    const now = new Date('2026-08-09T10:00:00Z');
    expect(nextStreak(5, new Date('2026-08-09T08:00:00Z'), now)).toBe(5);
  });

  it('streak: kecha → +1', () => {
    const now = new Date('2026-08-09T10:00:00Z');
    expect(nextStreak(5, new Date('2026-08-08T20:00:00Z'), now)).toBe(6);
  });

  it('streak: uzilish → 1', () => {
    const now = new Date('2026-08-09T10:00:00Z');
    expect(nextStreak(5, new Date('2026-08-06T20:00:00Z'), now)).toBe(1);
    expect(nextStreak(0, null, now)).toBe(1);
  });
});
