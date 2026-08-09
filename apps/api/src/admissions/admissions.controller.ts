import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  admissionConvertSchema,
  admissionReviewSchema,
  admissionSubmitSchema,
  paginationSchema,
  type AdmissionConvertDto,
  type AdmissionReviewDto,
  type AdmissionSubmitDto,
  type PaginationDto,
} from '@idu/validation';
import { Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { AdmissionsService } from './admissions.service';

@ApiTags('admissions')
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Ariza topshirish (abituriyent, ochiq)' })
  submit(@Body(new ZodValidationPipe(admissionSubmitSchema)) dto: AdmissionSubmitDto) {
    return this.admissions.submit(dto);
  }

  @Get()
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Admission' })
  @ApiOperation({ summary: 'Arizalar ro\'yxati (dekanat)' })
  @UsePipes(new ZodValidationPipe(paginationSchema))
  list(@Query() query: PaginationDto & { status?: string }) {
    return this.admissions.list(query);
  }

  @Patch(':id/review')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'update', subject: 'Admission' })
  @ApiOperation({ summary: 'Arizani ko\'rib chiqish (holat + izoh)' })
  review(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(admissionReviewSchema)) dto: AdmissionReviewDto,
  ) {
    return this.admissions.review(id, dto);
  }

  @Post(':id/convert')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'create', subject: 'Student' })
  @ApiOperation({ summary: 'Abituriyentni talabaga aylantirish' })
  convert(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(admissionConvertSchema)) dto: AdmissionConvertDto,
  ) {
    return this.admissions.convert(id, dto);
  }
}
