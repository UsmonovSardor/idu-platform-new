import { SetMetadata } from '@nestjs/common';
import type { Action, Subject } from '@idu/types';

export interface RequiredRule {
  action: Action;
  subject: Subject;
}

export const CHECK_POLICIES_KEY = 'check_policies';

/** Endpoint uchun kerakli CASL ruxsatlar (R21). Masalan: @CheckPolicies({ action: 'create', subject: 'Grade' }). */
export const CheckPolicies = (...rules: RequiredRule[]) => SetMetadata(CHECK_POLICIES_KEY, rules);
