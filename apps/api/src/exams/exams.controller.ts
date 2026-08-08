import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  examSchema,
  gradeOpenAnswerSchema,
  proctorEventSchema,
  questionSchema,
  submitAttemptSchema,
  type ExamDto,
  type ProctorEventDto,
  type QuestionDto,
  type SubmitAttemptDto,
} from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { ExamsService } from './exams.service';

@ApiTags('exams')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  // ── O'qituvchi: bank + imtihon ──
  @Post('questions')
  @CheckPolicies({ action: 'create', subject: 'Exam' })
  @ApiOperation({ summary: 'Savol yaratish (bank yoki imtihonga)' })
  createQuestion(@Body(new ZodValidationPipe(questionSchema)) dto: QuestionDto) {
    return this.exams.createQuestion(dto);
  }

  @Get('questions/course/:courseId')
  @CheckPolicies({ action: 'create', subject: 'Exam' })
  listQuestions(@Param('courseId') courseId: string) {
    return this.exams.listQuestions(courseId);
  }

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Exam' })
  @ApiOperation({ summary: 'Imtihon yaratish' })
  createExam(@Body(new ZodValidationPipe(examSchema)) dto: ExamDto, @CurrentUser('id') userId: string) {
    return this.exams.createExam(dto, userId);
  }

  @Get('course/:courseId')
  @CheckPolicies({ action: 'read', subject: 'Exam' })
  listByCourse(@Param('courseId') courseId: string) {
    return this.exams.listExamsByCourse(courseId);
  }

  @Get(':id/results')
  @CheckPolicies({ action: 'create', subject: 'Exam' })
  @ApiOperation({ summary: 'Imtihon natijalari (o\'qituvchi)' })
  results(@Param('id') id: string) {
    return this.exams.results(id);
  }

  @Post('answers/:answerId/grade')
  @CheckPolicies({ action: 'create', subject: 'Exam' })
  @ApiOperation({ summary: 'OPEN savolni qo\'lda baholash' })
  gradeOpen(
    @Param('answerId') answerId: string,
    @Body(new ZodValidationPipe(gradeOpenAnswerSchema)) dto: { score: number },
  ) {
    return this.exams.gradeOpenAnswer(answerId, dto.score);
  }

  // ── Talaba: sessiya ──
  @Post(':id/start')
  @CheckPolicies({ action: 'read', subject: 'Exam' })
  @ApiOperation({ summary: 'Imtihonni boshlash (savollar aralashtiriladi)' })
  start(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.exams.startAttempt(id, userId);
  }

  @Post('attempts/:attemptId/submit')
  @CheckPolicies({ action: 'read', subject: 'Exam' })
  @ApiOperation({ summary: 'Imtihonni topshirish (avtomatik baholanadi)' })
  submit(
    @Param('attemptId') attemptId: string,
    @Body(new ZodValidationPipe(submitAttemptSchema)) dto: SubmitAttemptDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.exams.submitAttempt(attemptId, userId, dto);
  }

  @Post('attempts/:attemptId/proctor')
  @CheckPolicies({ action: 'read', subject: 'Exam' })
  @ApiOperation({ summary: 'Proctoring hodisasi (tab almashtirish → avto-yopish)' })
  proctor(
    @Param('attemptId') attemptId: string,
    @Body(new ZodValidationPipe(proctorEventSchema)) dto: ProctorEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.exams.proctorViolation(attemptId, userId, dto.type);
  }

  @Get('attempts/me')
  @CheckPolicies({ action: 'read', subject: 'Exam' })
  myAttempts(@CurrentUser('id') userId: string) {
    return this.exams.myAttempts(userId);
  }
}
