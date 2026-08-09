import { clickSignString, md5, verifyClickSign } from './click-signature';

describe('Click imzo (signature)', () => {
  const secret = 'SECRET_KEY';
  const base = {
    click_trans_id: '12345',
    service_id: '100',
    merchant_trans_id: 'ORDER-1',
    amount: '50000.00',
    action: '0',
    sign_time: '2026-01-01 10:00:00',
  };

  it('Prepare imzo satri merchant_prepare_id siz quriladi', () => {
    expect(clickSignString(base, secret)).toBe(
      '12345100SECRET_KEYORDER-150000.0002026-01-01 10:00:00',
    );
  });

  it('Complete imzo satriga merchant_prepare_id qo\'shiladi', () => {
    const s = clickSignString({ ...base, merchant_prepare_id: '77', action: '1' }, secret);
    expect(s).toBe('12345100SECRET_KEYORDER-17750000.0012026-01-01 10:00:00');
  });

  it('to\'g\'ri imzo tekshiruvdan o\'tadi, soxta o\'tmaydi', () => {
    const sign = md5(clickSignString(base, secret));
    expect(verifyClickSign({ ...base, sign_string: sign }, secret)).toBe(true);
    expect(verifyClickSign({ ...base, sign_string: 'fake' }, secret)).toBe(false);
    expect(verifyClickSign(base, secret)).toBe(false); // imzosiz
  });
});
