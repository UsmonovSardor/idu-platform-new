import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { CHECK_POLICIES_KEY, type RequiredRule } from './policies.decorator';

/** @CheckPolicies bilan belgilangan endpointlarni CASL ability bo'yicha tekshiradi. */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rules =
      this.reflector.getAllAndOverride<RequiredRule[]>(CHECK_POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (rules.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Ruxsat yo\'q');

    const ability = this.abilityFactory.createForUser({
      id: user.id,
      role: user.role,
      permissions: user.permissions ?? [],
    });

    const allowed = rules.every((r) => ability.can(r.action, r.subject));
    if (!allowed) throw new ForbiddenException('Bu amalga ruxsatingiz yo\'q');
    return true;
  }
}
