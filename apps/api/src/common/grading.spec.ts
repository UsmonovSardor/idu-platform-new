import { computeGrade, computeWeightedGpa } from '@idu/types';

describe('Baholash logikasi (BHM modeli)', () => {
  it('to\'liq ball → A va 4.0 GPA', () => {
    const r = computeGrade({ jn: 30, on: 20, yn: 30, mi: 20 });
    expect(r.total).toBe(100);
    expect(r.letter).toBe('A');
    expect(r.gpa).toBe(4.0);
    expect(r.passed).toBe(true);
  });

  it('past ball → F va yiqilish', () => {
    const r = computeGrade({ jn: 10, on: 5, yn: 10, mi: 5 });
    expect(r.total).toBe(30);
    expect(r.letter).toBe('F');
    expect(r.passed).toBe(false);
  });

  it("chegara (55) → o'tish balli E", () => {
    const r = computeGrade({ jn: 20, on: 10, yn: 15, mi: 10 });
    expect(r.total).toBe(55);
    expect(r.passed).toBe(true);
    expect(r.letter).toBe('E');
  });

  it('kredit-og\'irlikli GPA to\'g\'ri hisoblanadi', () => {
    const gpa = computeWeightedGpa([
      { gpa: 4.0, credits: 3 },
      { gpa: 3.0, credits: 6 },
    ]);
    expect(gpa).toBeCloseTo(3.33, 2);
  });
});
