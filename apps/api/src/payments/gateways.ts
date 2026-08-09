/** To'lov shlyuzlari uchun checkout URL quruvchilar (real formatlar). */

export interface PaymeConfig {
  merchantId: string;
}
export interface ClickConfig {
  serviceId: string;
  merchantId: string;
}

/** Payme: base64(m=merchant;ac.order_id=<id>;a=<tiyin>) → checkout.paycom.uz. */
export function buildPaymeCheckoutUrl(cfg: PaymeConfig, orderId: string, amountSom: number): string {
  const tiyin = Math.round(amountSom * 100);
  const params = `m=${cfg.merchantId};ac.order_id=${orderId};a=${tiyin}`;
  const encoded = Buffer.from(params).toString('base64');
  return `https://checkout.paycom.uz/${encoded}`;
}

/** Click: my.click.uz/services/pay so'rov parametrlari bilan. */
export function buildClickCheckoutUrl(cfg: ClickConfig, orderId: string, amountSom: number): string {
  const q = new URLSearchParams({
    service_id: cfg.serviceId,
    merchant_id: cfg.merchantId,
    amount: String(amountSom),
    transaction_param: orderId,
  });
  return `https://my.click.uz/services/pay?${q.toString()}`;
}
