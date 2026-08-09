import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { announcementSchema, type AnnouncementDto } from '@idu/validation';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { AnnouncementsService } from './announcements.service';

@ApiTags('announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @CheckPolicies({ action: 'read', subject: 'Announcement' })
  @ApiOperation({ summary: "E'lonlar ro'yxati" })
  list() {
    return this.announcements.list();
  }

  @Post()
  @CheckPolicies({ action: 'create', subject: 'Announcement' })
  @ApiOperation({ summary: "E'lon joylash (audience'ga bildirishnoma yuboriladi)" })
  create(
    @Body(new ZodValidationPipe(announcementSchema)) dto: AnnouncementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.announcements.create(dto, userId);
  }

  @Delete(':id')
  @CheckPolicies({ action: 'delete', subject: 'Announcement' })
  remove(@Param('id') id: string) {
    return this.announcements.remove(id);
  }
}
