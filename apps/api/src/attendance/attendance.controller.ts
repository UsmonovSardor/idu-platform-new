import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  bulkAttendanceSchema,
  markAttendanceSchema,
  qrGenerateSchema,
  qrSubmitSchema,
  type BulkAttendanceDto,
  type MarkAttendanceDto,
  type QrGenerateDto,
  type QrSubmitDto,
} from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { AttendanceService } from './attendance.service';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post()
  @CheckPolicies({ action: 'update', subject: 'Attendance' })
  @ApiOperation({ summary: 'Davomat belgilash (manual)' })
  mark(
    @Body(new ZodValidationPipe(markAttendanceSchema)) dto: MarkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendance.mark(dto, userId);
  }

  @Post('bulk')
  @CheckPolicies({ action: 'update', subject: 'Attendance' })
  @ApiOperation({ summary: 'Guruhga ommaviy davomat' })
  bulk(
    @Body(new ZodValidationPipe(bulkAttendanceSchema)) dto: BulkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendance.bulkMark(dto, userId);
  }

  @Post('qr/generate')
  @CheckPolicies({ action: 'update', subject: 'Attendance' })
  @ApiOperation({ summary: "O'qituvchi QR sessiya ochadi" })
  qrGenerate(@Body(new ZodValidationPipe(qrGenerateSchema)) dto: QrGenerateDto) {
    return this.attendance.generateQrToken(dto.courseId, dto.ttlSeconds);
  }

  @Post('qr/submit')
  @CheckPolicies({ action: 'read', subject: 'Attendance' })
  @ApiOperation({ summary: "Talaba QR orqali o'zini belgilaydi" })
  qrSubmit(
    @Body(new ZodValidationPipe(qrSubmitSchema)) dto: QrSubmitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.attendance.markViaQr(dto.token, userId);
  }

  @Get('course/:courseId/stats')
  @CheckPolicies({ action: 'read', subject: 'Attendance' })
  courseStats(@Param('courseId') courseId: string) {
    return this.attendance.courseStats(courseId);
  }

  @Get('student/:studentId/stats')
  @CheckPolicies({ action: 'read', subject: 'Attendance' })
  studentStats(@Param('studentId') studentId: string) {
    return this.attendance.studentStats(studentId);
  }
}
