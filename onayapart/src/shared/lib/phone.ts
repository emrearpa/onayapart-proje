/** Telefon numarasini uluslararasi rakam dizisine cevirir (orn. "0530 652 70 88" -> "905306527088"). */
export function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = "90" + digits; // TR numarasi varsayimi
  return digits;
}
