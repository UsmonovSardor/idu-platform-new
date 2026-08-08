import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { scheduleSchema, type ScheduleDto } from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { ScheduleService } from './schedule.service';

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Schedule' })
  @ApiOperation({ summary: 'Dars qo\'shish (to\'qnashuv tekshiriladi)' })
  create(@Body(new ZodValidationPipe(scheduleSchema)) dto: ScheduleDto) {
    return this.schedule.create(dto);
  }

  @Get('me')
  @CheckPolicies({ action: 'read', subject: 'Schedule' })
  @ApiOperation({ summary: 'Mening jadvalim (talaba)' })
  mine(@CurrentUser('id') userId: string) {
    return this.schedule.findMine(userId);
  }

  @Get('group/:groupId')
  @CheckPolicies({ action: 'read', subject: 'Schedule' })
  @ApiOperation({ summary: 'Guruh jadvali' })
  byGroup(@Param('groupId') groupId: string) {
    return this.schedule.findByGroup(groupId);
  }

  @Delete(':id')
  @CheckPolicies({ action: 'delete', subject: 'Schedule' })
  remove(@Param('id') id: string) {
    return this.schedule.remove(id);
  }
}
