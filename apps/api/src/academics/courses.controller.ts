import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { courseSchema, paginationSchema, type PaginationDto } from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { CoursesService } from './courses.service';

type CourseInput = { name: string; code: string; credits: number; teacherId?: string };

@ApiTags('academics')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @CheckPolicies({ action: 'read', subject: 'Course' })
  @ApiOperation({ summary: "Fanlar ro'yxati" })
  @UsePipes(new ZodValidationPipe(paginationSchema))
  findAll(@Query() query: PaginationDto) {
    return this.courses.findAll(query);
  }

  @Get('mine')
  @CheckPolicies({ action: 'read', subject: 'Course' })
  @ApiOperation({ summary: "Mening fanlarim (o'qituvchi)" })
  mine(@CurrentUser('id') userId: string) {
    return this.courses.findMineByTeacher(userId);
  }

  @Get(':id')
  @CheckPolicies({ action: 'read', subject: 'Course' })
  findOne(@Param('id') id: string) {
    return this.courses.findOne(id);
  }

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Course' })
  create(
    @Body(new ZodValidationPipe(courseSchema)) body: CourseInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.courses.create(body, userId);
  }

  @Patch(':id')
  @CheckPolicies({ action: 'update', subject: 'Course' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(courseSchema.partial())) body: Partial<CourseInput>,
  ) {
    return this.courses.update(id, body);
  }

  @Delete(':id')
  @CheckPolicies({ action: 'delete', subject: 'Course' })
  remove(@Param('id') id: string) {
    return this.courses.remove(id);
  }
}
