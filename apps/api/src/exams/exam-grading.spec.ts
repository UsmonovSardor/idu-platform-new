import { gradeAnswer, stripAnswers, type GradableQuestion } from './exam-grading';

describe('Imtihon avtomatik baholash', () => {
  const single: GradableQuestion = {
    type: 'SINGLE',
    points: 2,
    options: [
      { id: 'a', text: '1', correct: false },
      { id: 'b', text: '2', correct: true },
    ],
  };

  it("SINGLE — to'g'ri variant → to'liq ball", () => {
    expect(gradeAnswer(single, 'b')).toEqual({ score: 2, needsManual: false });
  });

  it("SINGLE — noto'g'ri → 0", () => {
    expect(gradeAnswer(single, 'a')).toEqual({ score: 0, needsManual: false });
  });

  it('MULTIPLE — barcha to\'g\'ri (va faqat ular) → to\'liq ball', () => {
    const q: GradableQuestion = {
      type: 'MULTIPLE',
      points: 3,
      options: [
        { id: 'a', text: 'x', correct: true },
        { id: 'b', text: 'y', correct: true },
        { id: 'c', text: 'z', correct: false },
      ],
    };
    expect(gradeAnswer(q, ['a', 'b']).score).toBe(3);
    expect(gradeAnswer(q, ['a', 'b', 'c']).score).toBe(0); // ortiqcha → 0
    expect(gradeAnswer(q, ['a']).score).toBe(0); // kam → 0
  });

  it('OPEN — qo\'lda baholanadi', () => {
    expect(gradeAnswer({ type: 'OPEN', points: 5, options: [] }, 'javob')).toEqual({
      score: 0,
      needsManual: true,
    });
  });

  it('stripAnswers — correct maydonini yashiradi', () => {
    expect(stripAnswers(single.options)).toEqual([
      { id: 'a', text: '1' },
      { id: 'b', text: '2' },
    ]);
  });
});
