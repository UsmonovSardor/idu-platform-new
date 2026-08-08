import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import type { AccessPayload } from '../token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /** Token to'g'ri bo'lsa — foydalanuvchi + ruxsatlarni yuklaydi (req.user). */
  async validate(payload: AccessPayload) {
    const user = await this.authService.loadAuthUser(payload.sub);
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi yoki faol emas');
    return user;
  }
}
