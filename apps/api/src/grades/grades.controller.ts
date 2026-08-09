import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  bulkGradeSchema,
  gradeInputSchema,
  type GradeInputDto,
} from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { GradesService } from './grades.service';

@ApiTags('grades')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Grade' })
  @ApiOperation({ summary: 'Baho kiritish (JN/ON/YN/MI → avtomatik harf + GPA)' })
  create(
    @Body(new ZodValidationPipe(gradeInputSchema)) dto: GradeInputDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.grades.upsert(dto, { userId, ip: req.ip });
  }

  @Post('bulk')
  @CheckPolicies({ action: 'create', subject: 'Grade' })
  @ApiOperation({ summary: 'Guruhga ommaviy baho (bitta fan)' })
  bulk(
    @Body(new ZodValidationPipe(bulkGradeSchema))
    dto: { courseId: string; grades: Array<Omit<GradeInputDto, 'courseId'>> },
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.grades.bulkUpsert(dto.courseId, dto.grades, { userId, ip: req.ip });
  }

  @Get('me')
  @CheckPolicies({ action: 'read', subject: 'Grade' })
  @ApiOperation({ summary: "Mening baholarim va GPA (talaba)" })
  mine(@CurrentUser('id') userId: string) {
    return this.grades.findMine(userId);
  }

  @Get('debtors')
  @CheckPolicies({ action: 'read', subject: 'Report' })
  @ApiOperation({ summary: 'Qarzdor talabalar (dekanat)' })
  debtors(@Query('courseId') courseId?: string) {
    return this.grades.debtors(courseId);
  }

  @Get('course/:courseId/roster')
  @CheckPolicies({ action: 'read', subject: 'Grade' })
  @ApiOperation({ summary: "Fan baholash reyestri — talabalar + mavjud baholar (o'qituvchi)" })
  roster(@Param('courseId') courseId: string) {
    return this.grades.rosterForCourse(courseId);
  }

  @Get('student/:studentId')
  @CheckPolicies({ action: 'read', subject: 'Grade' })
  @ApiOperation({ summary: "Talaba baholari (o'qituvchi/dekanat)" })
  forStudent(@Param('studentId') studentId: string) {
    return this.grades.findForStudent(studentId);
  }
}
