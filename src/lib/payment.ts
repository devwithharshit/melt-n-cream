/**
 * Google Pay / UPI settings.
 * The owner's static QR is shown to customers; the UPI ID also supports mobile payment links.
 */
import qrAsset from "@/assets/melt-n-cream-google-pay.png.asset.json";

export const PAYMENT = {
  UPI_ID: "gautamharshitofficial@okicici",
  PAYEE_NAME: "Melt N Cream",
  QR_IMAGE_URL: qrAsset.url,
};

export function upiLink(amountPaise: number, note: string) {
  const params = new URLSearchParams({
    pa: PAYMENT.UPI_ID,
    pn: PAYMENT.PAYEE_NAME,
    am: (amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
