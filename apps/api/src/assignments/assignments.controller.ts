import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  assignmentSchema,
  gradeSubmissionSchema,
  submitAssignmentSchema,
  type AssignmentDto,
  type GradeSubmissionDto,
  type SubmitAssignmentDto,
} from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { AssignmentsService } from './assignments.service';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Assignment' })
  @ApiOperation({ summary: 'Topshiriq yaratish (o\'qituvchi)' })
  create(
    @Body(new ZodValidationPipe(assignmentSchema)) dto: AssignmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignments.create(dto, userId);
  }

  @Get('course/:courseId')
  @CheckPolicies({ action: 'read', subject: 'Assignment' })
  listByCourse(@Param('courseId') courseId: string) {
    return this.assignments.listByCourse(courseId);
  }

  @Get('me')
  @CheckPolicies({ action: 'create', subject: 'Submission' })
  @ApiOperation({ summary: 'Mening yuklamalarim (talaba)' })
  mine(@CurrentUser('id') userId: string) {
    return this.assignments.mySubmissions(userId);
  }

  @Post(':id/submit')
  @CheckPolicies({ action: 'create', subject: 'Submission' })
  @ApiOperation({ summary: 'Topshiriqni yuklash (talaba)' })
  submit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitAssignmentSchema)) dto: SubmitAssignmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignments.submit(id, userId, dto);
  }

  @Get(':id/submissions')
  @CheckPolicies({ action: 'read', subject: 'Assignment' })
  submissions(@Param('id') id: string) {
    return this.assignments.listSubmissions(id);
  }

  @Post('submissions/:submissionId/grade')
  @CheckPolicies({ action: 'update', subject: 'Grade' })
  @ApiOperation({ summary: 'Yuklamani baholash (o\'qituvchi)' })
  grade(
    @Param('submissionId') submissionId: string,
    @Body(new ZodValidationPipe(gradeSubmissionSchema)) dto: GradeSubmissionDto,
  ) {
    return this.assignments.gradeSubmission(submissionId, dto);
  }
}
