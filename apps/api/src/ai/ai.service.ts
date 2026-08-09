import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const DISABLED = {
  enabled: false as const,
  message: 'AI moduli sozlanmagan (ANTHROPIC_API_KEY yo\'q).',
};

/**
 * AI-yordamchi modullari (§7.14). Claude (claude-opus-5) orqali.
 * Graceful degradation: kalit bo'lmasa xatosiz o'chadi (acceptance criteria).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.model = config.get<string>('AI_MODEL', 'claude-opus-5');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  private async complete(system: string, user: string, maxTokens = 2000): Promise<string> {
    // claude-opus-5 default'da adaptiv o'ylaydi — thinking parametrisiz.
    const res = await this.client!.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }

  /** Fan/mavzu bo'yicha test savollari generatsiyasi (o'qituvchi uchun). */
  async generateQuestions(topic: string, count: number, type: string) {
    if (!this.client) return DISABLED;
    const system =
      "Sen universitet o'qituvchisiga yordam beruvchi assistentsan. Faqat JSON qaytar, boshqa matn yozma.";
    const user = `"${topic}" mavzusida ${count} ta ${type} turidagi test savoli yarat.
Format: JSON massiv, har element: {"text": "...", "options": [{"text":"...","correct":true|false}], "points": 1}.
OPEN turida options bo'sh massiv bo'lsin. O'zbek tilida yoz.`;
    try {
      const raw = await this.complete(system, user, 3000);
      const json = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const questions = JSON.parse(json);
      return { enabled: true as const, questions };
    } catch (err) {
      this.logger.warn(`AI savol generatsiyasi xato: ${(err as Error).message}`);
      return { enabled: true as const, error: 'Generatsiya muvaffaqiyatsiz', questions: [] };
    }
  }

  /** Talaba o'zlashtirishini tahlil qilib tavsiyalar beradi. */
  async analyzePerformance(studentId: string) {
    if (!this.client) return DISABLED;
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        user: { select: { fullName: true } },
        grades: { include: { course: { select: { name: true } } } },
      },
    });
    if (!student) throw new NotFoundException('Talaba topilmadi');

    const gradeLines = student.grades
      .map((g) => `${g.course.name}: ${g.total} ball (${g.letter ?? '-'})`)
      .join('; ');
    const system =
      "Sen talabaga o'quv jarayonida yordam beruvchi mehribon ustozsan. Qisqa, amaliy tavsiyalar ber.";
    const user = `Talaba: ${student.user.fullName}, GPA: ${student.gpa}.
Baholar: ${gradeLines || 'baho yo\'q'}.
Kuchli va zaif tomonlarini aniqlab, yaxshilash uchun 3 ta aniq tavsiya ber (o'zbekcha).`;

    const analysis = await this.complete(system, user, 1500);
    return { enabled: true as const, analysis };
  }

  /** AI o'quv yordamchisi (savol-javob). */
  async chat(message: string) {
    if (!this.client) return DISABLED;
    const system =
      "Sen IDU universitetining AI o'quv yordamchisisan. Aniq, foydali va xushmuomala javob ber. Shaxsiy ma'lumot so'rama.";
    const reply = await this.complete(system, message, 1500);
    return { enabled: true as const, reply };
  }
}
