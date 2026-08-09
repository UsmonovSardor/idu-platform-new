import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createRoomSchema, type CreateRoomDto } from '@idu/validation';
import { z } from 'zod';
import { CurrentUser } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckPolicies } from '../rbac/policies.decorator';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

const sendSchema = z.object({ body: z.string().trim().min(1).max(4000) });

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @Post('rooms')
  @CheckPolicies({ action: 'create', subject: 'Chat' })
  @ApiOperation({ summary: 'Chat xonasi yaratish (1:1 yoki guruh)' })
  createRoom(
    @Body(new ZodValidationPipe(createRoomSchema)) dto: CreateRoomDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.chat.createRoom(dto, userId);
  }

  @Get('rooms')
  @CheckPolicies({ action: 'read', subject: 'Chat' })
  @ApiOperation({ summary: 'Mening chatlarim' })
  myRooms(@CurrentUser('id') userId: string) {
    return this.chat.listRooms(userId);
  }

  @Get('rooms/:id/messages')
  @CheckPolicies({ action: 'read', subject: 'Chat' })
  history(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.chat.history(id, userId);
  }

  @Post('rooms/:id/messages')
  @CheckPolicies({ action: 'create', subject: 'Chat' })
  @ApiOperation({ summary: 'Xabar yuborish (real-time tarqatiladi)' })
  async send(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendSchema)) dto: { body: string },
    @CurrentUser('id') userId: string,
  ) {
    const msg = await this.chat.createMessage(id, userId, dto.body);
    this.gateway.emitToRoom(id, msg);
    return msg;
  }
}
