import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mening XP, daraja, streak va nishonlarim' })
  me(@CurrentUser('id') userId: string) {
    return this.gamification.getProfile(userId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Reyting jadvali' })
  leaderboard(@Query('limit') limit?: string) {
    return this.gamification.leaderboard(limit ? Number(limit) : 20);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Barcha nishonlar' })
  badges() {
    return this.gamification.listBadges();
  }
}
