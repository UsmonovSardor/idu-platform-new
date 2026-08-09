import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { DOCUMENT_TYPES, type DocumentType } from '@idu/types';
import { CurrentUser, Public } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { DocumentsService } from './documents.service';

const generateSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  studentId: z.string().uuid().optional(),
});

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('generate')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'create', subject: 'Document' })
  @ApiOperation({ summary: 'Hujjat generatsiyasi (PDF + QR)' })
  generate(
    @Body(new ZodValidationPipe(generateSchema)) dto: { type: DocumentType; studentId?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.documents.generate(dto.type, dto.studentId, userId);
  }

  @Public()
  @Get('verify/:qrHash')
  @ApiOperation({ summary: 'QR orqali hujjat haqiqiyligini tekshirish (ochiq)' })
  verify(@Param('qrHash') qrHash: string) {
    return this.documents.verify(qrHash);
  }

  @Get('student/:studentId')
  @ApiBearerAuth()
  @CheckPolicies({ action: 'read', subject: 'Document' })
  list(@Param('studentId') studentId: string) {
    return this.documents.listForStudent(studentId);
  }
}
