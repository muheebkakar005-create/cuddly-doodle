/** Accept 03XXXXXXXXX, 03XX-XXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX */
export function normalizePakistaniPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let local = digits;

  if (local.startsWith("+92")) local = "0" + local.slice(3);
  else if (local.startsWith("92") && local.length >= 12) local = "0" + local.slice(2);

  const compact = local.replace(/\D/g, "");
  if (!/^03\d{9}$/.test(compact)) return null;
  return compact;
}

export function formatPhoneDisplay(phone: string): string {
  const n = phone.replace(/\D/g, "");
  if (n.length === 11 && n.startsWith("03")) {
    return `${n.slice(0, 4)}-${n.slice(4)}`;
  }
  return phone;
}

export function toWhatsAppE164(phone: string): string {
  const n = phone.replace(/\D/g, "");
  if (n.startsWith("0")) return "92" + n.slice(1);
  if (n.startsWith("92")) return n;
  return n;
}

export function isValidPakistaniPhone(input: string): boolean {
  return normalizePakistaniPhone(input) !== null;
}
