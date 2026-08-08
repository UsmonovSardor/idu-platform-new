import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import type { Action, Subject } from '@idu/types';

export type AppAbility = MongoAbility<[Action, Subject]>;

export interface AbilityUser {
  id: string;
  role: string;
  permissions: Array<{ action: Action; subject: Subject }>;
}

/**
 * Foydalanuvchi ruxsatlaridan (DB'dan yuklangan) CASL ability quradi (R21).
 * ADMIN → manage all. Boshqalar → DB'dagi role_permissions bo'yicha.
 */
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AbilityUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === 'ADMIN') {
      can('manage', 'all');
    } else {
      for (const p of user.permissions) {
        can(p.action, p.subject);
      }
    }

    return build();
  }
}
