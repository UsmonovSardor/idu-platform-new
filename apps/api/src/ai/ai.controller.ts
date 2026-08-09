import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { AiService } from './ai.service';

const genSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  count: z.number().int().min(1).max(20).default(5),
  type: z.enum(['SINGLE', 'MULTIPLE', 'OPEN', 'TRUE_FALSE']).default('SINGLE'),
});

const chatSchema = z.object({ message: z.string().trim().min(1).max(2000) });

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'AI moduli yoqilganmi' })
  status() {
    return { enabled: this.ai.isEnabled() };
  }

  @Post('questions/generate')
  @CheckPolicies({ action: 'create', subject: 'Exam' })
  @ApiOperation({ summary: 'AI orqali test savollari (o\'qituvchi)' })
  generate(@Body(new ZodValidationPipe(genSchema)) dto: { topic: string; count: number; type: string }) {
    return this.ai.generateQuestions(dto.topic, dto.count, dto.type);
  }

  @Get('analysis/:studentId')
  @CheckPolicies({ action: 'read', subject: 'Report' })
  @ApiOperation({ summary: 'AI o\'zlashtirish tahlili' })
  analysis(@Param('studentId') studentId: string) {
    return this.ai.analyzePerformance(studentId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'AI o\'quv yordamchisi' })
  chat(@Body(new ZodValidationPipe(chatSchema)) dto: { message: string }) {
    return this.ai.chat(dto.message);
  }
}
