/**
 * Baholash modeli — O'zbekiston BHM (TZ §7.3).
 * JN (0–30) + ON (0–20) + YN (0–30) + MI (0–20) = 100 ball.
 * Harf baho va GPA avtomatik hisoblanadi. Yagona manba shu yerda.
 */
export const GRADE_COMPONENTS = {
  JN: { label: 'Joriy nazorat', max: 30 },
  ON: { label: 'Oraliq nazorat', max: 20 },
  YN: { label: 'Yakuniy nazorat', max: 30 },
  MI: { label: 'Mustaqil ish', max: 20 },
} as const;

export type GradeComponent = keyof typeof GRADE_COMPONENTS;

export const GRADE_TOTAL_MAX = 100;

/** Harf baho chegaralari (past → yuqori). GPA — 4.0 shkala. */
export interface LetterBand {
  letter: string;
  min: number;
  gpa: number;
}

export const LETTER_BANDS: readonly LetterBand[] = [
  { letter: 'A', min: 90, gpa: 4.0 },
  { letter: 'B', min: 80, gpa: 3.5 },
  { letter: 'C', min: 70, gpa: 3.0 },
  { letter: 'D', min: 60, gpa: 2.5 },
  { letter: 'E', min: 55, gpa: 2.0 },
  { letter: 'F', min: 0, gpa: 0.0 },
];

/** O'tish balli — F dan yuqorisi. */
export const PASSING_SCORE = 55;

export interface GradeInput {
  jn: number;
  on: number;
  yn: number;
  mi: number;
}

export interface GradeResult {
  total: number;
  letter: string;
  gpa: number;
  passed: boolean;
}

/** Jami ballni hisoblash (0–100). */
export function computeTotal(g: GradeInput): number {
  return g.jn + g.on + g.yn + g.mi;
}

/** Jami balldan harf baho va GPA. Chegaralar past→yuqori bo'lgani uchun teskari qidiramiz. */
export function resolveLetter(total: number): LetterBand {
  for (const band of LETTER_BANDS) {
    if (total >= band.min) return band;
  }
  return LETTER_BANDS[LETTER_BANDS.length - 1]!; // F (fallback)
}

/** To'liq natija: total + letter + gpa + passed. */
export function computeGrade(g: GradeInput): GradeResult {
  const total = computeTotal(g);
  const band = resolveLetter(total);
  return { total, letter: band.letter, gpa: band.gpa, passed: total >= PASSING_SCORE };
}

/** Kredit-og'irlikli o'rtacha GPA (TZ §7.3 acceptance criteria). */
export function computeWeightedGpa(
  entries: ReadonlyArray<{ gpa: number; credits: number }>,
): number {
  const totalCredits = entries.reduce((s, e) => s + e.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = entries.reduce((s, e) => s + e.gpa * e.credits, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}
