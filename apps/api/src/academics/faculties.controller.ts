import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { facultySchema, paginationSchema, type PaginationDto } from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { FacultiesService } from './faculties.service';

@ApiTags('academics')
@ApiBearerAuth()
@Controller('faculties')
export class FacultiesController {
  constructor(private readonly faculties: FacultiesService) {}

  @Get()
  @CheckPolicies({ action: 'read', subject: 'Faculty' })
  @ApiOperation({ summary: "Fakultetlar ro'yxati (paginated)" })
  @UsePipes(new ZodValidationPipe(paginationSchema))
  findAll(@Query() query: PaginationDto) {
    return this.faculties.findAll(query);
  }

  @Get(':id')
  @CheckPolicies({ action: 'read', subject: 'Faculty' })
  findOne(@Param('id') id: string) {
    return this.faculties.findOne(id);
  }

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Faculty' })
  @ApiOperation({ summary: 'Yangi fakultet (kod o\'zgartirishsiz — R7)' })
  create(
    @Body(new ZodValidationPipe(facultySchema)) body: { name: string; code: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.faculties.create(body, userId);
  }

  @Patch(':id')
  @CheckPolicies({ action: 'update', subject: 'Faculty' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(facultySchema.partial())) body: Partial<{ name: string; code: string }>,
  ) {
    return this.faculties.update(id, body);
  }

  @Delete(':id')
  @CheckPolicies({ action: 'delete', subject: 'Faculty' })
  remove(@Param('id') id: string) {
    return this.faculties.remove(id);
  }
}
