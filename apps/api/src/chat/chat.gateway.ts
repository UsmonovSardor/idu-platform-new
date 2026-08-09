import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

/** Real-time chat gateway (§7.11, R40). Handshake'da JWT tekshiriladi. */
@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chat: ChatService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const raw =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!raw) throw new Error('token yo\'q');
      const payload = await this.jwt.verifyAsync(raw, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    if (await this.chat.isMember(roomId, client.data.userId)) {
      await client.join(roomId);
      return { ok: true };
    }
    return { ok: false, error: 'A\'zo emassiz' };
  }

  @SubscribeMessage('message')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; body: string },
  ) {
    const msg = await this.chat.createMessage(data.roomId, client.data.userId, data.body);
    this.server.to(data.roomId).emit('message', msg);
    return msg;
  }

  /** REST orqali yuborilgan xabarni ham real-time tarqatish. */
  emitToRoom(roomId: string, message: unknown): void {
    this.server?.to(roomId).emit('message', message);
  }
}
