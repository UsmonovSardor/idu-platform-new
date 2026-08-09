import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirishnomalar markazi (in-app)' })
  list(@CurrentUser('id') userId: string) {
    return this.notifications.list(userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notifications.unreadCount(userId).then((count) => ({ count }));
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notifications.markRead(id, userId);
  }

  @Post('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
