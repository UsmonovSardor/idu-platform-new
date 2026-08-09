import { createHmac } from 'node:crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface VerifiedInitData {
  user: TelegramUser;
  authDate: number;
}

/**
 * Telegram Mini App initData'ni tekshiradi (§8.2.2, HMAC-SHA256).
 * secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
 * hash       = HMAC_SHA256(key=secret_key, msg=data_check_string)
 * @returns tekshiruvdan o'tsa foydalanuvchi ma'lumoti, aks holda null.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 86400,
): VerifiedInitData | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computed !== hash) return null;

  const authDate = Number(params.get('auth_date') ?? 0);
  if (maxAgeSec > 0 && Date.now() / 1000 - authDate > maxAgeSec) return null; // eskirgan

  const userRaw = params.get('user');
  if (!userRaw) return null;
  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return null;
  }
  return { user, authDate };
}
