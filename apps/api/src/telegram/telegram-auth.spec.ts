import { createHmac } from 'node:crypto';
import { verifyTelegramInitData } from './telegram-auth';

/** Test uchun to'g'ri imzolangan initData quradi. */
function signInitData(fields: Record<string, string>, botToken: string): string {
  const dataCheckString = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  const params = new URLSearchParams(fields);
  params.set('hash', hash);
  return params.toString();
}

describe('Telegram initData tekshiruvi', () => {
  const token = '123456:ABC-TEST-TOKEN';
  const user = JSON.stringify({ id: 777, first_name: 'Ali', username: 'ali' });

  it("to'g'ri imzo → foydalanuvchi qaytadi", () => {
    const initData = signInitData(
      { user, auth_date: String(Math.floor(Date.now() / 1000)), query_id: 'q1' },
      token,
    );
    const res = verifyTelegramInitData(initData, token);
    expect(res?.user.id).toBe(777);
    expect(res?.user.username).toBe('ali');
  });

  it("buzilgan ma'lumot → null", () => {
    const initData = signInitData({ user, auth_date: String(Math.floor(Date.now() / 1000)) }, token);
    const tampered = initData.replace('Ali', 'Hacker');
    expect(verifyTelegramInitData(tampered, token)).toBeNull();
  });

  it("noto'g'ri bot token → null", () => {
    const initData = signInitData({ user, auth_date: String(Math.floor(Date.now() / 1000)) }, token);
    expect(verifyTelegramInitData(initData, 'wrong-token')).toBeNull();
  });

  it('eskirgan auth_date → null', () => {
    const initData = signInitData({ user, auth_date: '1000000000' }, token);
    expect(verifyTelegramInitData(initData, token, 60)).toBeNull();
  });
});
