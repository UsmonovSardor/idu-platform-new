import type { QuestionType } from '@idu/types';

export interface QuestionOption {
  id: string;
  text: string;
  correct?: boolean;
}

export interface GradableQuestion {
  type: QuestionType;
  options: QuestionOption[];
  points: number;
}

export interface GradeOutcome {
  score: number;
  needsManual: boolean;
}

/**
 * Bitta javobni avtomatik baholaydi (§7.6). OPEN → qo'lda baholanadi.
 * SINGLE/TRUE_FALSE: tanlangan variant id to'g'ri bo'lsa to'liq ball.
 * MULTIPLE: barcha to'g'ri variantlar (va faqat ular) tanlansa to'liq ball.
 */
export function gradeAnswer(q: GradableQuestion, value: unknown): GradeOutcome {
  switch (q.type) {
    case 'OPEN':
      return { score: 0, needsManual: true };

    case 'SINGLE':
    case 'TRUE_FALSE': {
      const correctId = q.options.find((o) => o.correct)?.id;
      return { score: value === correctId ? q.points : 0, needsManual: false };
    }

    case 'MULTIPLE': {
      const correctIds = q.options
        .filter((o) => o.correct)
        .map((o) => o.id)
        .sort();
      const selected = (Array.isArray(value) ? value.map(String) : []).sort();
      const match =
        correctIds.length === selected.length &&
        correctIds.every((id, i) => id === selected[i]);
      return { score: match ? q.points : 0, needsManual: false };
    }

    default:
      return { score: 0, needsManual: false };
  }
}

/** Talabaga savolni yuborishda to'g'ri javoblarni yashiradi (leak oldini olish). */
export function stripAnswers(options: QuestionOption[]): Array<{ id: string; text: string }> {
  return options.map((o) => ({ id: o.id, text: o.text }));
}
