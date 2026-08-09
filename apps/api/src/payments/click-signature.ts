import { createHash } from 'node:crypto';

/** Click callback imzo parametrlari (Click Merchant API). */
export interface ClickSignParams {
  click_trans_id: string | number;
  service_id: string | number;
  merchant_trans_id: string;
  merchant_prepare_id?: string | number;
  amount: string | number;
  action: string | number;
  sign_time: string;
  sign_string?: string;
}

/**
 * Click imzo satri (§13 — callback imzo tekshiruvi):
 * Prepare:  md5(click_trans_id + service_id + SECRET + merchant_trans_id + amount + action + sign_time)
 * Complete: md5(... + merchant_prepare_id qo'shiladi, merchant_trans_id dan keyin)
 */
export function clickSignString(p: ClickSignParams, secret: string): string {
  const parts: Array<string | number> = [p.click_trans_id, p.service_id, secret, p.merchant_trans_id];
  if (p.merchant_prepare_id !== undefined && p.merchant_prepare_id !== '') {
    parts.push(p.merchant_prepare_id);
  }
  parts.push(p.amount, p.action, p.sign_time);
  return parts.join('');
}

export function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

/** Kelgan sign_string haqiqiyligini tekshiradi. */
export function verifyClickSign(p: ClickSignParams, secret: string): boolean {
  if (!p.sign_string) return false;
  return md5(clickSignString(p, secret)) === p.sign_string;
}
