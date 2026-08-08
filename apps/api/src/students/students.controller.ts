import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { paginationSchema, type PaginationDto } from '@idu/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @CheckPolicies({ action: 'read', subject: 'Student' })
  @ApiOperation({ summary: "Talabalar ro'yxati (o'qituvchi/dekanat)" })
  @UsePipes(new ZodValidationPipe(paginationSchema))
  findAll(@Query() query: PaginationDto & { groupId?: string }) {
    return this.students.findAll(query);
  }

  @Get(':id')
  @CheckPolicies({ action: 'read', subject: 'Student' })
  findOne(@Param('id') id: string) {
    return this.students.findOne(id);
  }
}
